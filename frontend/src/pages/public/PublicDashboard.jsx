import { Landmark, MapPin, FileText, Images, Search, CalendarDays, Gavel, LocateFixed, HelpCircle } from "lucide-react";
import ActionGrid from "../../components/ActionGrid";
import ProfileCard from "../../components/ProfileCard";
import { useAuth } from "../../context/AuthContext";

export default function PublicDashboard() {
  const { user } = useAuth();
  const actions = [
    {
      to: "/exhibitions",
      icon: CalendarDays,
      title: "Exhibitions & Events",
      description: "Discover exhibitions, educational tours, and cultural events near you.",
    },
    {
      to: "/search",
      icon: Search,
      title: "Smart Artifact Search",
      description: "Search artifacts by civilization, era, region, material, usage, or location.",
    },
    {
      to: "/museums",
      icon: Landmark,
      title: "Museum Directory",
      description: "Browse museums and see what's on display, in storage, or on loan.",
    },
    {
      to: "/near-me",
      icon: LocateFixed,
      title: "Near Me",
      description: "Find archaeological sites, exhibitions, and museums close to you.",
    },
    {
      to: "/auctions",
      icon: Gavel,
      title: "Auctions",
      description: "Bid on artifacts released for auction, and build your wishlist.",
    },
    {
      to: "/my-reports",
      icon: FileText,
      title: "My Reports",
      description: "Track the status of discoveries you have submitted to ArchiveEarth.",
    },
    {
      to: "/qna",
      icon: HelpCircle,
      title: "Public Archaeology Q&A",
      description: "Ask archaeologists a question, or browse answers from the community.",
    },
  ];

  return (
    <div className="page">
      <h1>General Public Dashboard</h1>

      <p className="page-subtitle">
        Welcome to ArchiveEarth. Help preserve history by reporting newly
        discovered artifacts and exploring Bangladesh's cultural heritage.
      </p>

      {user && (
        <ProfileCard
          name={user.name}
          nid={user.nid}
          email={user.email}
          role="Public Member"
          lines={[user.phone && `Phone: ${user.phone}`]}
        />
      )}

      <ActionGrid items={actions} />
    </div>
  );
}