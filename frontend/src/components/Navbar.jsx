import { Link, useNavigate } from "react-router-dom";
import { Landmark, MapPin, FileText, ScanSearch, ClipboardList, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <Link
  to={user ? (
    user.role === "public"
      ? "/public/dashboard"
      : user.role === "archaeologist"
      ? "/arc/dashboard"
      : user.role === "museum_manager"
      ? "/mm/dashboard"
      : user.role === "site_caretaker"
      ? "/sc/dashboard"
      : user.role === "admin"
      ? "/admin/dashboard"
      : "/"
  ) : "/"}
  className="brand"
>
        <Landmark size={20} strokeWidth={2.2} />
         ArchiveEARTH
      </Link>
      <div className="nav-right">
        {user ? (
          <>
            <Link to="/report-discovery"><MapPin size={15} /> Report Discovery</Link>
            <Link to="/my-reports"><FileText size={15} /> My Reports</Link>
            {user.role === "archaeologist" && (
              <Link to="/arc/assignments"><ClipboardList size={15} /> My Assignments</Link>
            )}
            {user.role === "admin" && (
              <Link to="/admin/reports"><ScanSearch size={15} /> Field Reports</Link>
            )}
            <span className="nav-user">{user.role}</span>
            <button className="btn-link nav-logout" onClick={handleLogout}>
              <LogOut size={15} /> Logout
            </button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}