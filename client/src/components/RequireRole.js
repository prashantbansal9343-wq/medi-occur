import { Navigate } from "react-router-dom";
import { dashboardPathForRole } from "../utils/dashboardPaths";

/**
 * Redirects to the correct dashboard if the logged-in user's role does not match.
 */
export default function RequireRole({ user, allowedRole, children }) {
  if (!user?.role) {
    return <Navigate to="/" replace />;
  }
  if (user.role !== allowedRole) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }
  return children;
}
