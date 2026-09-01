import { Landmark, MapPin, FileText, Search, CalendarDays, Gavel, LocateFixed, MessagesSquare } from "lucide-react";
import { Link } from "react-router-dom";
import ActionGrid from "../../components/ActionGrid";
import ProfileCard from "../../components/ProfileCard";
import { useAuth } from "../../context/AuthContext";

export default function PublicDashboard() {
  const { user } = useAuth();
  const actions = [
    {
      to: "/exhibitions",
      icon: CalendarDays,
      title: "Exhibitions & events",
      description: "Exhibitions, educational tours, and cultural programmes near you.",
    },
    {
      to: "/search",
      icon: Search,
      title: "Artifact catalogue",
      description: "Search the national record by civilization, era, region, material, or use.",
    },
    {
      to: "/museums",
      icon: Landmark,
      title: "Museum directory",
      description: "Participating museums and what each holds on display, in storage, or on loan.",
    },
    {
      to: "/near-me",
      icon: LocateFixed,
      title: "Sites near you",
      description: "Recorded excavation sites, museums, and events within reach.",
    },
    {
      to: "/auctions",
      icon: Gavel,
      title: "Artifact auctions",
      description: "Bid on lots released for lawful sale and follow the ones you are watching.",
    },
    {
      to: "/my-reports",
      icon: FileText,
      title: "My submissions",
      description: "Follow every discovery you have reported through inspection and verification.",
    },
    {
      to: "/qna",
      icon: MessagesSquare,
      title: "Ask an archaeologist",
      description: "Put a question to working researchers, or read what they have answered before.",
    },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Public Member</span>
          <h1>Your workspace</h1>
          <p className="page-subtitle">
            Report newly surfaced artifacts, follow your submissions, and explore the public
            record of Bangladesh&apos;s heritage.
          </p>
        </div>
        <Link className="btn" to="/report-discovery">
          <MapPin size={16} aria-hidden="true" /> Report a find
        </Link>
      </div>

      {user && (
        <ProfileCard
          name={user.name}
          nid={user.nid}
          email={user.email}
          role="Public Member"
          lines={[user.phone && `Phone: ${user.phone}`]}
        />
      )}

      <div className="section-head">
        <h2>Explore the register</h2>
      </div>
      <ActionGrid items={actions} />
    </div>
  );
}