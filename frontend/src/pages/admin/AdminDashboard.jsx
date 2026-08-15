import { useEffect, useState } from "react";
import { ClipboardCheck, Hammer, MapPinned, ListChecks, ScanSearch, Users, Gavel, FileSignature, FolderKanban } from "lucide-react";
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
    // Ahad_23201016 - Tender Publication & Management
    { to: "/admin/tenders", icon: FileSignature, title: "Excavation Tenders", description: "Publish tenders, review bids, and assign excavation teams" },
    { to: "/admin/excavation-projects", icon: FolderKanban, title: "Excavation Projects", description: "Track awarded digs and allocate the artifacts they recover" },
    { to: "/admin/item-requests", icon: ClipboardCheck, title: "Item Requests", description: "Approve or deny museum loan requests" },
    { to: "/admin/tool-requests", icon: Hammer, title: "Tool Requests", description: "Approve equipment rental requests" },
    { to: "/admin/excavation-requests", icon: MapPinned, title: "Excavation Requests", description: "Turn proposals into active projects" },
    { to: "/admin/approved-requests", icon: ListChecks, title: "Approved Requests", description: "See everything that's already been approved" },
    { to: "/admin/pending-users", icon: Users, title: "Pending User Approvals", description: "Approve or reject user registrations."},
    { to: "/admin/auctions", icon: Gavel, title: "Manage Auctions", description: "Create auctions and track bidding through to close" },
  ];

  return (
    <div className="page">
      <h1>Admin Dashboard</h1>
      <p className="page-subtitle">Government oversight for excavation tenders, discoveries, and heritage operations.</p>

      <ActionGrid items={actions} />
    </div>
  );
}