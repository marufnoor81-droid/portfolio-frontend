import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const baseURL = import.meta.env.VITE_API_URL;

if (!baseURL) {
    throw new Error("VITE_API_URL is required. Copy .env.example to .env and set the API URL.");
}

const api = axios.create({ baseURL, timeout: 15000 });
let refreshInFlight: Promise<string> | null = null;

export function getVisitorId(): string {
    const key = "devfolio-visitor-id";
    let visitorId = localStorage.getItem(key);
    if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem(key, visitorId);
    }
    return visitorId;
}

api.interceptors.request.use((config) => {
    const access = localStorage.getItem("devfolio-access");
    if (access) {
        config.headers.Authorization = `Bearer ${access}`;
    }
    config.headers["X-Visitor-Id"] = getVisitorId();
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const request = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
        const url = request?.url ?? "";
        const isAuthEndpoint = /\/auth\/(login|refresh|logout)\//.test(url);
        if (error.response?.status !== 401 || !request || request._retry || isAuthEndpoint) {
            return Promise.reject(error);
        }

        const refresh = localStorage.getItem("devfolio-refresh");
        if (!refresh) {
            clearAuth();
            return Promise.reject(error);
        }

        request._retry = true;
        try {
            if (!refreshInFlight) {
                refreshInFlight = api.post<{ access: string; refresh?: string }>("/auth/refresh/", { refresh })
                    .then(({ data }) => {
                        localStorage.setItem("devfolio-access", data.access);
                        if (data.refresh) localStorage.setItem("devfolio-refresh", data.refresh);
                        return data.access;
                    })
                    .finally(() => {
                        refreshInFlight = null;
                    });
            }
            const access = await refreshInFlight;
            request.headers.Authorization = `Bearer ${access}`;
            return api(request);
        } catch (refreshError) {
            clearAuth();
            if (window.location.pathname !== "/login") {
                window.location.assign("/login");
            }
            return Promise.reject(refreshError);
        }
    },
);

function clearAuth() {
    localStorage.removeItem("devfolio-access");
    localStorage.removeItem("devfolio-refresh");
    localStorage.removeItem("devfolio-owner");
    window.dispatchEvent(new Event("devfolio-auth-cleared"));
}

export function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) return "Too many attempts, please try later.";
        const data = error.response?.data as Record<string, unknown> | undefined;
        const detail = data?.detail;
        if (typeof detail === "string") return detail;
        if (data) {
            const first = Object.values(data).flat()[0];
            if (typeof first === "string") return first;
        }
        return error.message;
    }
    return error instanceof Error ? error.message : "Something went wrong.";
}

export function getFieldErrors(error: unknown): Record<string, string> {
    if (!axios.isAxiosError(error) || !error.response?.data || typeof error.response.data !== "object") return {};
    const data = error.response.data as Record<string, unknown>;
    return Object.fromEntries(
        Object.entries(data)
            .filter(([key, value]) => key !== "detail" && Array.isArray(value))
            .map(([key, value]) => [key, (value as unknown[]).map(String).join(" ")]),
    );
}

export default api;
