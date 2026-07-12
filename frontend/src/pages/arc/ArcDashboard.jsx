import { useEffect, useState } from "react";
import { MapPinned, FolderKanban, ClipboardList } from "lucide-react";
import { api } from "../../api";
import ProfileCard from "../../components/ProfileCard";
import ActionGrid from "../../components/ActionGrid";

export default function ArcDashboard() {
  const [archaeologist, setArchaeologist] = useState(null);

  useEffect(() => {
    api.get("/arc/dashboard").then((data) => setArchaeologist(data.archaeologist));
  }, []);

  if (!archaeologist) return <div className="page">Loading...</div>;

  const actions = [
    { to: "/arc/request-excavation", icon: MapPinned, title: "Request Excavation", description: "Propose a new or existing dig site" },
    { to: "/arc/projects", icon: FolderKanban, title: "Manage Projects", description: "Teams, tools, items, and site details" },
    { to: "/arc/assignments", icon: ClipboardList, title: "Field Inspections & Reports", description: "Verify assigned discoveries and compile researcher reports" },
  ];

  return (
    <div className="page">
      <h1>Archaeologist Dashboard</h1>
      <p className="page-subtitle">Manage your excavation projects, teams, and field assignments.</p>

      <ProfileCard
        name={archaeologist.name}
        nid={archaeologist.nid}
        email={archaeologist.email}
        role="Archaeologist / Researcher"
        lines={[
          archaeologist.affiliation && `Affiliation: ${archaeologist.affiliation}`,
          archaeologist.biography,
        ]}
      />

      <ActionGrid items={actions} />
    </div>
  );
}