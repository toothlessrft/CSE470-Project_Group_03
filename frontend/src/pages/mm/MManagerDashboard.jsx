import { useEffect, useState } from "react";
import { PackageSearch } from "lucide-react";
import { api } from "../../api";
import ProfileCard from "../../components/ProfileCard";
import ActionGrid from "../../components/ActionGrid";

export default function MManagerDashboard() {
  const [manager, setManager] = useState(null);

  useEffect(() => {
    api.get("/mm/dashboard").then((data) => setManager(data.m_manager));
  }, []);

  if (!manager) return <div className="page">Loading...</div>;

  const actions = [
    { to: "/mm/request-items", icon: PackageSearch, title: "Request Items", description: "Ask to borrow artifacts for exhibition" },
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