import { lazy, Suspense, useEffect, type ComponentType } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { SiteLayout } from "./components/layout/SiteLayout";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LoadingState } from "./components/ui/States";

const HomePage = lazy(() => import("./pages/PublicPages").then((module) => ({ default: module.HomePage })));
const AboutPage = lazy(() => import("./pages/PublicPages").then((module) => ({ default: module.AboutPage })));
const ProjectsPage = lazy(() => import("./pages/PublicPages").then((module) => ({ default: module.ProjectsPage })));
const ProjectDetailPage = lazy(() => import("./pages/PublicPages").then((module) => ({ default: module.ProjectDetailPage })));
const BlogPage = lazy(() => import("./pages/PublicPages").then((module) => ({ default: module.BlogPage })));
const BlogPostPage = lazy(() => import("./pages/PublicPages").then((module) => ({ default: module.BlogPostPage })));
const ContactPage = lazy(() => import("./pages/PublicPages").then((module) => ({ default: module.ContactPage })));
const LoginPage = lazy(() => import("./pages/PublicPages").then((module) => ({ default: module.LoginPage })));
const NotFoundPage = lazy(() => import("./pages/PublicPages").then((module) => ({ default: module.NotFoundPage })));
const OwnerDashboard = lazy(() => import("./components/dashboard/OwnerDashboard").then((module) => ({ default: module.OwnerDashboard })));

function AsyncPage({ component: Page }: { component: ComponentType }) {
    return <Suspense fallback={<LoadingState label="Opening page" />}><Page /></Suspense>;
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        mutations: { retry: 0 },
    },
});

function ScrollRestoration() {
    const location = useLocation();
    useEffect(() => {
        if (!location.hash) window.scrollTo({ top: 0, behavior: "auto" });
    }, [location.pathname, location.search, location.hash]);
    return null;
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AuthProvider>
                    <ThemeProvider>
                        <ScrollRestoration />
                        <Routes>
                            <Route element={<SiteLayout />}>
                                <Route index element={<AsyncPage component={HomePage} />} />
                                <Route path="about" element={<AsyncPage component={AboutPage} />} />
                                <Route path="projects" element={<AsyncPage component={ProjectsPage} />} />
                                <Route path="projects/:slug" element={<AsyncPage component={ProjectDetailPage} />} />
                                <Route path="blog" element={<AsyncPage component={BlogPage} />} />
                                <Route path="blog/:slug" element={<AsyncPage component={BlogPostPage} />} />
                                <Route path="contact" element={<AsyncPage component={ContactPage} />} />
                                <Route path="login" element={<AsyncPage component={LoginPage} />} />
                                <Route path="*" element={<AsyncPage component={NotFoundPage} />} />
                                <Route element={<ProtectedRoute />}>
                                    <Route path="dashboard/*" element={<Suspense fallback={<LoadingState label="Opening owner dashboard" />}><OwnerDashboard /></Suspense>} />
                                </Route>
                            </Route>
                        </Routes>
                        <Toaster position="bottom-right" richColors closeButton />
                    </ThemeProvider>
                </AuthProvider>
            </BrowserRouter>
        </QueryClientProvider>
    );
}
