import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Replaces @login_required (+ the inline role checks) from app.py.
export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="page">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/unauthorized" replace />;

  return children;
}
