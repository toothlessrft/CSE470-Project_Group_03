import { Link, useNavigate } from "react-router-dom";
import { Landmark, MapPin, ScanSearch, LogOut, Search, BookOpen, LayoutDashboard, CalendarDays, Gavel, FileText } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ROLE_LABELS = {
  admin: "Admin",
  archaeologist: "Archaeologist",
  museum_manager: "Museum Manager",
  excavation_team: "Excavation Team", // Ahad_23201016
  public: "Public Member",
};

const ROLE_HOME = {
  public: "/public/dashboard",
  archaeologist: "/arc/dashboard",
  museum_manager: "/mm/dashboard",
  excavation_team: "/et/dashboard", // Ahad_23201016
  admin: "/admin/dashboard",
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      {/* ArchiveEarth logo goes to the general informational homepage */}
      <Link to="/" className="brand">
        <Landmark size={20} strokeWidth={2.2} />
        ArchiveEarth
      </Link>
      <div className="nav-right">
        <Link to="/search"><Search size={15} /> Search Artifacts</Link>
        <Link to="/knowledge"><BookOpen size={15} /> Knowledge Hub</Link>
        <Link to="/exhibitions"><CalendarDays size={15} /> Exhibitions & Events</Link>
        <Link to="/auctions"><Gavel size={15} /> Auctions</Link>
        {user ? (
          <>
            <Link to="/report-discovery"><MapPin size={15} /> Report Discovery</Link>
            {user.role === "admin" && (
              <Link to="/admin/reports"><ScanSearch size={15} /> Field Reports</Link>
            )}
            {user.role === "admin" && (
              <Link to="/admin/auctions"><Gavel size={15} /> Manage Auctions</Link>
            )}
            {/* Ahad_23201016 */}
            {user.role === "admin" && (
              <Link to="/admin/tenders"><FileText size={15} /> Tenders</Link>
            )}
            {user.role === "excavation_team" && (
              <Link to="/et/tenders"><FileText size={15} /> Tenders</Link>
            )}

            {/* Profile Dashboard link — styled like other nav links */}
            <Link
              to={ROLE_HOME[user.role] || "/"}
              className="nav-user"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
            >
              <LayoutDashboard size={14} />
              <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>{ROLE_LABELS[user.role] || user.role}</span>
                <span style={{ fontSize: "0.65rem", opacity: 0.72 }}>Dashboard</span>
              </span>
            </Link>
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