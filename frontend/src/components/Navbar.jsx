import { Link, useNavigate } from "react-router-dom";
import {
  Landmark,
  MapPin,
  LogOut,
  Search,
  BookOpen,
  LayoutDashboard,
  CalendarDays,
  Gavel,
  FileText,
  LocateFixed,
  Compass,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import ChatBell from "./ChatBell";
import NavDropdown from "./NavDropdown";

const ROLE_LABELS = {
  admin: "Admin",
  archaeologist: "Archaeologist",
  museum_manager: "Museum Manager",
  excavation_team: "Excavation Team",
  public: "Public Member",
};

const ROLE_HOME = {
  public: "/public/dashboard",
  archaeologist: "/arc/dashboard",
  museum_manager: "/mm/dashboard",
  excavation_team: "/et/dashboard",
  admin: "/admin/dashboard",
};

const EXPLORE_ITEMS = [
  { to: "/search", icon: Search, label: "Search Artifacts" },
  { to: "/knowledge", icon: BookOpen, label: "Knowledge Hub" },
  { to: "/exhibitions", icon: CalendarDays, label: "Exhibitions & Events" },
  { to: "/museums", icon: Landmark, label: "Museum Directory" },
  { to: "/near-me", icon: LocateFixed, label: "Near Me" },
  { to: "/auctions", icon: Gavel, label: "Auctions" },
  { to: "/qna", icon: HelpCircle, label: "QnA" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <Landmark size={20} strokeWidth={2.2} />
        ArchiveEarth
      </Link>
      <div className="nav-right">
        <NavDropdown label="Explore" icon={Compass} items={EXPLORE_ITEMS} />

        {user ? (
          <>
            <Link to="/report-discovery"><MapPin size={15} /> Report Discovery</Link>

            {user.role === "excavation_team" && (
              <Link to="/et/tenders"><FileText size={15} /> Tenders</Link>
            )}

            {(user.role === "archaeologist" || user.role === "excavation_team") && <ChatBell />}
            <NotificationBell />

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