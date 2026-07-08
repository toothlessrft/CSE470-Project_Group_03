import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";
import { api } from "../../api";
import ProfileCard from "../../components/ProfileCard";
import ActionGrid from "../../components/ActionGrid";

export default function SCaretakerDashboard() {
  const [caretaker, setCaretaker] = useState(null);

  useEffect(() => {
    api.get("/sc/dashboard").then((data) => setCaretaker(data.s_caretaker));
  }, []);

  if (!caretaker) return <div className="page">Loading...</div>;

  const actions = [
    { to: "/sc/request-maintenance", icon: Wrench, title: "Request Maintenance", description: "Flag upkeep needed at your assigned site" },
  ];

  return (
    <div className="page">
      <h1>Site Caretaker Dashboard</h1>
      <p className="page-subtitle">Keep your assigned excavation site in good condition.</p>

      <ProfileCard
        name={caretaker.name}
        nid={caretaker.nid}
        email={caretaker.email}
        role="Excavation Team"
        lines={[
          caretaker.site && `Assigned site: ${caretaker.site.name}`,
          caretaker.budget != null && `Budget: ${caretaker.budget}`,
        ]}
      />

      <ActionGrid items={actions} />
    </div>
  );
}