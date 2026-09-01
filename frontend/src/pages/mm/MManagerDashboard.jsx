import { useEffect, useState } from "react";
import { PackageSearch, HandCoins, Inbox, CalendarDays, Gavel, Archive, Settings, FileClock } from "lucide-react";
import { api } from "../../api";
import ProfileCard from "../../components/ProfileCard";
import ActionGrid from "../../components/ActionGrid";

export default function MManagerDashboard() {
  const [manager, setManager] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/mm/dashboard")
      .then((data) => setManager(data.m_manager))
      .catch((err) => setError(err.message || "Could not load dashboard."));
  }, []);

  if (error) {
    return (
      <div className="page">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  if (!manager)
    return (
      <div className="page">
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading your workspace
        </div>
      </div>
    );

  const actions = [
    { to: "/mm/exhibitions", icon: CalendarDays, title: "Exhibitions & events", description: "Schedule and publish exhibitions, tours, and cultural programmes" },
    { to: "/mm/my-museum-items", icon: Archive, title: "Collection register", description: "Maintain your holdings and their display, storage, or loan status" },
    { to: "/mm/museum-profile", icon: Settings, title: "Museum profile", description: "Location, opening hours, and admission details shown in the public directory" },
    { to: "/mm/request-items", icon: PackageSearch, title: "Request artifacts", description: "Apply to the heritage authority to hold an artifact for exhibition" },
    { to: "/mm/request-loan", icon: HandCoins, title: "Request a loan", description: "Ask another museum to lend an artifact from its collection" },
    { to: "/mm/my-loans", icon: FileClock, title: "Outgoing loan requests", description: "Track the loans you have applied for and their outcomes" },
    { to: "/mm/incoming-loans", icon: Inbox, title: "Incoming loan requests", description: "Decide on requests from other museums to borrow your holdings" },
    { to: "/auctions", icon: Gavel, title: "Artifact auctions", description: "Bid on lots released for lawful sale" },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Museum Authority</span>
          <h1>Collection workspace</h1>
          <p className="page-subtitle">
            Manage your holdings, arrange loans with other museums, and publish exhibitions.
          </p>
        </div>
      </div>

      <ProfileCard
        name={manager.name}
        nid={manager.nid}
        email={manager.email}
        role="Museum Authority"
        lines={[
          manager.museum_name && `Museum: ${manager.museum_name}`,
          manager.m_city && [manager.m_street, manager.m_city].filter(Boolean).join(", "),
        ]}
      />

      <div className="section-head">
        <h2>Collection management</h2>
      </div>
      <ActionGrid items={actions} />
    </div>
  );
}