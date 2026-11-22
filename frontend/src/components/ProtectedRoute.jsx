import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Loader from "./Loader";

function ProtectedRoute({ allowedRoles = [] }) {
  const { user, isAuthenticated, loading, role } = useAuth();
  const location = useLocation();

  // Show clean spinner while checking HTTP-only cookie session
  if (loading) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px"
        }}
      >
        <Loader size={44} text="Verifying session..." />
      </div>
    );
  }

  // If not authenticated, redirect to login page with return path
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Normalize allowed roles to uppercase for strict role validation
  const normalizedAllowedRoles = allowedRoles.map((r) => {
    const upper = r.toUpperCase();
    if (upper === "BUSINESS") return "BUSINESS_OWNER";
    return upper;
  });

  // If role-based restrictions exist and current user does not have required role
  if (
    normalizedAllowedRoles.length > 0 &&
    (!role || !normalizedAllowedRoles.includes(role))
  ) {
    // Role-based smart redirection
    if (role === "BUSINESS_OWNER") {
      return <Navigate to="/business/dashboard" replace />;
    }
    if (role === "ADMIN") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Render child routes
  return <Outlet context={{ user }} />;
}

export default ProtectedRoute;
