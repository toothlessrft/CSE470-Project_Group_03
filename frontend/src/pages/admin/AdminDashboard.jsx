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

  if (!admin)
    return (
      <div className="page">
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading your workspace
        </div>
      </div>
    );

  const actions = [
    { key: "field_reports", to: "/admin/reports", icon: ScanSearch, title: "Field reports", description: "Review reported discoveries and assign an inspecting archaeologist" },
    // Ahad_23201016 - Tender Publication & Management
    { key: "tenders", to: "/admin/tenders", icon: FileSignature, title: "Excavation tenders", description: "Publish tenders, evaluate bids, and award contracts" },
    { key: "excavation_projects", to: "/admin/excavation-projects", icon: FolderKanban, title: "Excavation projects", description: "Track awarded excavations and allocate recovered artifacts" },
    { key: "item_requests", to: "/admin/item-requests", icon: ClipboardCheck, title: "Artifact requests", description: "Decide on museum requests to hold artifacts for exhibition" },
    { key: "tool_requests", to: "/admin/tool-requests", icon: Hammer, title: "Equipment requests", description: "Decide on field equipment issued to active excavations" },
    { key: "tool_inventory", to: "/admin/tool-inventory", icon: Boxes, title: "Equipment inventory", description: "Hold stock levels and track what is issued to each zone" },
    { key: "excavation_requests", to: "/admin/excavation-requests", icon: MapPinned, title: "Excavation proposals", description: "Assess research proposals and open them as licensed projects" },
    { key: "approved_requests", to: "/admin/approved-requests", icon: ListChecks, title: "Decision record", description: "Every request already approved, with dates and recipients" },
    { key: "pending_users", to: "/admin/pending-users", icon: Users, title: "Account approvals", description: "Verify and admit new professional registrations" },
    { key: "auctions", to: "/admin/auctions", icon: Gavel, title: "Artifact auctions", description: "List lots for lawful sale and follow bidding through to close" },
  ].map((action) => ({
    ...action,
    badge: counts[action.key] || 0,
      }));

  return (
    <div className="page">
            <div className="page-head">
        <div>
          <span className="eyebrow">Heritage Authority</span>
          <h1>Oversight workspace</h1>
        </div>
      </div>

      <ProfileCard
        name={admin.name}
        nid={admin.nid}
        email={admin.email}
        role="Heritage Authority"
        lines={[
          admin.administration && `Administration: ${admin.administration}`,
          admin.phone && `Phone: ${admin.phone}`,
        ]}
      />

      <div className="section-head">
        <h2>Outstanding work</h2>
        <span className="hint">Counts clear when the work is completed, not when the page is opened</span>
      </div>

      <ActionGrid items={actions} />
    </div>
  );
}
