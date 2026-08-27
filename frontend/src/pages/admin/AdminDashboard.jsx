import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, Hammer, MapPinned, ListChecks, ScanSearch, Users, Gavel, FileSignature, FolderKanban, Boxes } from "lucide-react";
import { api } from "../../api";
import ProfileCard from "../../components/ProfileCard";
import ActionGrid from "../../components/ActionGrid";

// How often the outstanding-work counts are refreshed while the tab is open.
const REFRESH_MS = 20 * 1000;

export default function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  // Red circles on the cards below. These are live counts of work still
  // waiting on the admin (pending requests, unassigned reports, active
  // auctions...), NOT unread notification counts - so a badge only clears once
  // the underlying request is actually approved, denied, or otherwise handled.
  const [counts, setCounts] = useState({});

  const loadCounts = useCallback(() => {
    api
      .get("/admin/work-summary")
      .then((data) => setCounts(data.counts || {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.get("/admin/dashboard").then((data) => setAdmin(data.admin));
    loadCounts();

    // Poll while open, and refresh the moment the admin comes back to the tab
    // or returns from one of the cards, so counts reflect what was just done.
    const timer = setInterval(loadCounts, REFRESH_MS);
    window.addEventListener("focus", loadCounts);
    document.addEventListener("visibilitychange", loadCounts);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", loadCounts);
      document.removeEventListener("visibilitychange", loadCounts);
    };
  }, [loadCounts]);

  if (!admin) return <div className="page">Loading...</div>;

  const actions = [
    { key: "field_reports", to: "/admin/reports", icon: ScanSearch, title: "Field Reports", description: "Review artifact discoveries and assign inspections" },
    // Ahad_23201016 - Tender Publication & Management
    { key: "tenders", to: "/admin/tenders", icon: FileSignature, title: "Excavation Tenders", description: "Publish tenders, review bids, and assign excavation teams" },
    { key: "excavation_projects", to: "/admin/excavation-projects", icon: FolderKanban, title: "Excavation Projects", description: "Track awarded digs and allocate the artifacts they recover" },
    { key: "item_requests", to: "/admin/item-requests", icon: ClipboardCheck, title: "Item Requests", description: "Approve or deny museum loan requests" },
    { key: "tool_requests", to: "/admin/tool-requests", icon: Hammer, title: "Tool Requests", description: "Approve equipment rental requests" },
    { key: "tool_inventory", to: "/admin/tool-inventory", icon: Boxes, title: "Equipment Inventory", description: "Manage and assign tools and equipment across active zones" },
    { key: "excavation_requests", to: "/admin/excavation-requests", icon: MapPinned, title: "Excavation Requests", description: "Turn proposals into active projects" },
    { key: "approved_requests", to: "/admin/approved-requests", icon: ListChecks, title: "Approved Requests", description: "See everything that's already been approved" },
    { key: "pending_users", to: "/admin/pending-users", icon: Users, title: "Pending User Approvals", description: "Approve or reject user registrations."},
    { key: "auctions", to: "/admin/auctions", icon: Gavel, title: "Manage Auctions", description: "Create auctions and track bidding through to close" },
  ].map((action) => ({
    ...action,
    badge: counts[action.key] || 0,
    // No onSelect: opening a card must not clear its count. The badge stands
    // for outstanding work, so only doing the work clears it.
  }));

  return (
    <div className="page">
      <h1>Admin Dashboard</h1>
      <p className="page-subtitle">Government oversight for excavation tenders, discoveries, and heritage operations.</p>

      <ProfileCard
        name={admin.name}
        nid={admin.nid}
        email={admin.email}
        role="Government / Admin"
        lines={[
          admin.administration && `Administration: ${admin.administration}`,
          admin.phone && `Phone: ${admin.phone}`,
        ]}
      />

      <p className="hint" style={{ marginTop: "1.2rem" }}>
        Red counts show items still waiting on you. They clear once the work is done, not when the page is opened.
      </p>

      <ActionGrid items={actions} />
    </div>
  );
}
