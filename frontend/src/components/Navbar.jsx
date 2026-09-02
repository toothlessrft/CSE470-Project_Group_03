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
  LocateFixed,
  Compass,
  MessagesSquare,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import ChatBell from "./ChatBell";
import NavDropdown from "./NavDropdown";
import BrandMark from "./BrandMark";

const ROLE_LABELS = {
  admin: "Heritage Authority",
  archaeologist: "Archaeologist",
  museum_manager: "Museum Authority",
  excavation_team: "Excavation Contractor",
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
  { to: "/search", icon: Search, label: "Artifact catalogue" },
  { to: "/knowledge", icon: BookOpen, label: "Knowledge hub" },
  { to: "/exhibitions", icon: CalendarDays, label: "Exhibitions & events" },
  { to: "/museums", icon: Landmark, label: "Museum directory" },
  { to: "/near-me", icon: LocateFixed, label: "Sites near you" },
  { to: "/auctions", icon: Gavel, label: "Artifact auctions" },
  { to: "/qna", icon: MessagesSquare, label: "Ask an archaeologist" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const adminItems = [
    { to: "/admin/reports", icon: ScanSearch, label: "Field Reports" },
    { to: "/admin/auctions", icon: Gavel, label: "Manage Auctions" },
    { to: "/admin/tenders", icon: FileText, label: "Tenders" },
  ];

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <span className="brand-mark" aria-hidden="true">
          <BrandMark size="2.05em" />
        </span>
        <span className="brand-text">
          ArchiveEarth
          <small>Heritage Registry</small>
        </span>
      </Link>

      <div className="nav-right">
        <NavDropdown label="Explore" icon={Compass} items={EXPLORE_ITEMS} />

        {user ? (
          <>
            <Link to="/report-discovery">
              <MapPin size={15} aria-hidden="true" /> Report a find
            </Link>

            <span className="nav-divider" aria-hidden="true" />

            {(user.role === "archaeologist" || user.role === "excavation_team") && <ChatBell />}
            <NotificationBell />

            <Link to={ROLE_HOME[user.role] || "/"} className="nav-user">
              <LayoutDashboard size={15} aria-hidden="true" />
              <span className="nav-user-text">
                <b>{ROLE_LABELS[user.role] || user.role}</b>
                <span>Workspace</span>
              </span>
            </Link>

            <button className="btn-link nav-logout" onClick={handleLogout}>
              <LogOut size={15} aria-hidden="true" /> Sign out
            </button>
          </>
        ) : (
          <>
            <span className="nav-divider" aria-hidden="true" />
            <Link to="/login">Sign in</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
