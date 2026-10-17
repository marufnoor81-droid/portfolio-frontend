import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import type { Owner } from "../api/types";

interface AuthContextValue {
    user: Owner | null;
    isOwner: boolean;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    const [hasToken, setHasToken] = useState(() => Boolean(localStorage.getItem("devfolio-access")));
    const session = useQuery({
        queryKey: ["auth", "me"],
        queryFn: async () => (await api.get<Owner>("/auth/me/")).data,
        enabled: hasToken,
        retry: false,
    });
    const loginMutation = useMutation({
        mutationFn: async (credentials: { username: string; password: string }) =>
            (await api.post<{ access: string; refresh: string; user: Owner }>("/auth/login/", credentials)).data,
        onSuccess: (data) => {
            localStorage.setItem("devfolio-access", data.access);
            localStorage.setItem("devfolio-refresh", data.refresh);
            localStorage.setItem("devfolio-owner", JSON.stringify(data.user));
            queryClient.setQueryData(["auth", "me"], data.user);
            setHasToken(true);
        },
    });
    const logoutMutation = useMutation({
        mutationFn: async () => {
            const refresh = localStorage.getItem("devfolio-refresh");
            if (refresh) await api.post("/auth/logout/", { refresh });
        },
        onSettled: () => {
            localStorage.removeItem("devfolio-access");
            localStorage.removeItem("devfolio-refresh");
            localStorage.removeItem("devfolio-owner");
            queryClient.removeQueries({ queryKey: ["auth"] });
            setHasToken(false);
        },
    });

    useEffect(() => {
        const clearSession = () => {
            setHasToken(false);
            queryClient.removeQueries({ queryKey: ["auth"] });
        };
        window.addEventListener("devfolio-auth-cleared", clearSession);
        return () => window.removeEventListener("devfolio-auth-cleared", clearSession);
    }, [queryClient]);

    useEffect(() => {
        if (session.isError) {
            localStorage.removeItem("devfolio-access");
            localStorage.removeItem("devfolio-refresh");
            localStorage.removeItem("devfolio-owner");
            setHasToken(false);
        }
    }, [session.isError]);

    const value = useMemo<AuthContextValue>(() => ({
        user: session.data ?? null,
        isOwner: Boolean(session.data),
        loading: hasToken && session.isLoading,
        login: async (username, password) => {
            await loginMutation.mutateAsync({ username, password });
        },
        logout: async () => {
            await logoutMutation.mutateAsync();
        },
    }), [session.data, session.isLoading, hasToken, loginMutation, logoutMutation]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const value = useContext(AuthContext);
    if (!value) throw new Error("useAuth must be used inside AuthProvider.");
    return value;
}
