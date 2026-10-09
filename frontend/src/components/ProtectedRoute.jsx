import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
 
// Each role has its own start page:
// Admin → Admin Dashboard, Student → study Dashboard.
export const homeFor = (user) => (user?.role === "Admin" ? "/admin" : "/");
 
// Redirects to /login when signed out; optionally requires a role.
// A user with the wrong role is sent to their own start page.
export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="center muted">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (role && user.role !== role) return <Navigate to={homeFor(user)} replace />;
  return children;
}
 
