import { useEffect, useState } from "react";
import { ClipboardCheck, Wrench, Hammer, MapPinned, ListChecks, ScanSearch, Users } from "lucide-react";
import { api } from "../../api";
import ProfileCard from "../../components/ProfileCard";
import ActionGrid from "../../components/ActionGrid";

export default function AdminDashboard() {
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    api.get("/admin/dashboard").then((data) => setAdmin(data.admin));
  }, []);

  if (!admin) return <div className="page">Loading...</div>;

  const actions = [
    { to: "/admin/reports", icon: ScanSearch, title: "Field Reports", description: "Review artifact discoveries and assign inspections" },
    { to: "/admin/item-requests", icon: ClipboardCheck, title: "Item Requests", description: "Approve or deny museum loan requests" },
    { to: "/admin/maintenance-requests", icon: Wrench, title: "Maintenance Requests", description: "Review site upkeep requests and budgets" },
    { to: "/admin/tool-requests", icon: Hammer, title: "Tool Requests", description: "Approve equipment rental requests" },
    { to: "/admin/excavation-requests", icon: MapPinned, title: "Excavation Requests", description: "Turn proposals into active projects" },
    { to: "/admin/approved-requests", icon: ListChecks, title: "Approved Requests", description: "See everything that's already been approved" },
    { to: "/admin/pending-users", icon: Users, title: "Pending User Approvals", description: "Approve or reject user registrations."},
  ];

  return (
    <div className="page">
      <h1>Admin Dashboard</h1>
      <p className="page-subtitle">Government oversight for excavation, maintenance, and heritage operations.</p>

      <ActionGrid items={actions} />
    </div>
  );
}