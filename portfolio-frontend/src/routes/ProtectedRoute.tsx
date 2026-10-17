import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoadingState } from "../components/ui/States";

export function ProtectedRoute() {
    const { isOwner, loading } = useAuth();
    const location = useLocation();
    if (loading) return <LoadingState label="Checking owner access" />;
    if (!isOwner) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    return <Outlet />;
}
