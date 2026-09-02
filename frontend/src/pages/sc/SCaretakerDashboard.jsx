import { useEffect, useState } from "react";
import { Wrench, Gavel, ListChecks } from "lucide-react";
import { api } from "../../api";
import ProfileCard from "../../components/ProfileCard";
import ActionGrid from "../../components/ActionGrid";

export default function SCaretakerDashboard() {
  const [caretaker, setCaretaker] = useState(null);

  useEffect(() => {
    api.get("/sc/dashboard").then((data) => setCaretaker(data.s_caretaker));
  }, []);

  if (!caretaker)
    return (
      <div className="page">
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading your workspace
        </div>
      </div>
    );

  const actions = [
    { to: "/sc/request-maintenance", icon: Wrench, title: "Request maintenance", description: "Report repair work needed at your assigned site" },
    { to: "/sc/tenders", icon: Gavel, title: "Open tenders", description: "Review excavation contracts and submit a bid" },
    { to: "/sc/my-bids", icon: ListChecks, title: "Submitted bids", description: "Track the outcome of every bid you have lodged" },
  ];

  return (
    <div className="page">
      <ProfileCard
        name={caretaker.name}
        nid={caretaker.nid}
        email={caretaker.email}
        role="Site Caretaker"
        lines={[
          caretaker.site && `Assigned site: ${caretaker.site.name}`,
          caretaker.budget != null && `Budget: ৳${Number(caretaker.budget).toLocaleString()}`,
        ]}
      />

      <div className="section-head">
        <h2>Site management</h2>
      </div>
      <ActionGrid items={actions} />
    </div>
  );
}