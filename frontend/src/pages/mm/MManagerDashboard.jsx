import { useEffect, useState } from "react";
import { PackageSearch, HandCoins, Inbox, CalendarDays } from "lucide-react";
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

  if (!manager) return <div className="page">Loading...</div>;

  const actions = [
    { to: "/mm/exhibitions", icon: CalendarDays, title: "Exhibition Management", description: "Schedule and publish exhibitions, educational tours, and cultural events" },
    { to: "/mm/request-items", icon: PackageSearch, title: "Request Items", description: "Ask to borrow artifacts for exhibition" },
    { to: "/mm/request-loan", icon: HandCoins, title: "Request Artifact Loan", description: "Ask another museum to loan an artifact" },
    { to: "/mm/my-loans", icon: PackageSearch, title: "My Loan Requests", description: "Track loans you've requested" },
    { to: "/mm/incoming-loans", icon: Inbox, title: "Incoming Loan Requests", description: "Approve, decline, and track loans to your museum" },
  ];

  return (
    <div className="page">
      <h1>Museum Manager Dashboard</h1>
      <p className="page-subtitle">Coordinate artifact loans and exhibitions with your museum.</p>

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

      <ActionGrid items={actions} />
    </div>
  );
}
