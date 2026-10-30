import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicOnly() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return <p>Checking your login...</p>;
  }

  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}