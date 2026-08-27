// Role-Based Notification & Reminder System
//
// Navbar bell with an unread count, and a floating panel that drills down in
// three steps: categories -> the notifications in that category -> the full
// notification, whose button opens the page the notification is about.
//
// Government/Admin does not get a bell - unread counts show up as red circles
// on the Admin Dashboard cards instead (see AdminDashboard.jsx).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Gavel,
  CalendarDays,
  FileText,
  ClipboardCheck,
  MapPinned,
  FileSignature,
  Clock,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  CheckCheck,
  ArrowUpRight,
  Inbox,
  Star,
} from "lucide-react";
import { api } from "../api";
import { goToLink } from "../utils/goToLink";
import { useAuth } from "../context/AuthContext";

// Keep in sync with CATEGORIES in backend/models/Notification.js
const CATEGORY_LABELS = [
  { key: "auction", label: "Auction Updates", icon: Gavel },
  { key: "event", label: "Exhibitions & Events", icon: CalendarDays },
  { key: "report", label: "Report Status", icon: FileText },
  { key: "request", label: "Requests & Approvals", icon: ClipboardCheck },
  { key: "assignment", label: "Assignments & Transfers", icon: MapPinned },
  { key: "tender", label: "Tenders & Bids", icon: FileSignature },
  { key: "review", label: "Reviews & Ratings", icon: Star },
  { key: "reminder", label: "Deadline Reminders", icon: Clock },
  { key: "account", label: "Account", icon: UserCheck },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORY_LABELS.map((c) => [c.key, c]));

// Keep in sync with CATEGORY_ROLES in backend/models/Notification.js.
// The backend already refuses to create a restricted notification for the
// wrong role, so this is belt-and-braces: it also hides rows that predate
// that rule, which would otherwise still be sitting in an old inbox.
const CATEGORY_ROLES = {
  review: ["archaeologist", "excavation_team"],
};

function canSeeCategory(category, role) {
  const allowed = CATEGORY_ROLES[category];
  return !allowed || allowed.includes(role);
}

const POLL_MS = 15 * 1000;

function timeAgo(value) {
  if (!value) return "";
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}

export default function NotificationBell() {
  const { user } = useAuth();
  const role = user?.role || "";

  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState({ unread: 0, byCategory: {} });
  const [allNotifications, setAllNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Everything below works off the role-filtered list, so a restricted
  // category cannot show up in the category list, the per-category counts, or
  // "Mark read".
  const notifications = useMemo(
    () => allNotifications.filter((n) => canSeeCategory(n.category, role)),
    [allNotifications, role]
  );

  // null = category list, a key = that category's list, plus `selected` for detail
  const [activeCategory, setActiveCategory] = useState(null);
  const [selected, setSelected] = useState(null);

  const panelRef = useRef(null);
  const navigate = useNavigate();

  const loadSummary = useCallback(() => {
    api
      .get("/notifications/summary")
      .then(setSummary)
      .catch(() => {});
  }, []);

  const loadNotifications = useCallback(() => {
    setLoading(true);
    api
      .get("/notifications?limit=100")
      .then((data) => setAllNotifications(data.notifications || []))
      .catch(() => setAllNotifications([]))
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, []);

  // Poll the cheap summary endpoint; the full list is only fetched on open.
  useEffect(() => {
    loadSummary();
    const timer = setInterval(loadSummary, POLL_MS);
    return () => clearInterval(timer);
  }, [loadSummary]);

  // Close on an outside click or Escape.
  useEffect(() => {
    if (!open) return undefined;

    function onClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function togglePanel() {
    const next = !open;
    setOpen(next);
    if (next) {
      setActiveCategory(null);
      setSelected(null);
      loadNotifications();
      loadSummary();
    }
  }

  // Categories that actually have something in them, newest activity first.
  const categories = useMemo(() => {
    const counts = {};
    const unreadCounts = {};
    for (const n of notifications) {
      counts[n.category] = (counts[n.category] || 0) + 1;
      if (!n.read) unreadCounts[n.category] = (unreadCounts[n.category] || 0) + 1;
    }
    return CATEGORY_LABELS.filter((c) => counts[c.key]).map((c) => ({
      ...c,
      total: counts[c.key],
      unread: unreadCounts[c.key] || 0,
    }));
  }, [notifications]);

  const visible = useMemo(
    () => (activeCategory ? notifications.filter((n) => n.category === activeCategory) : notifications),
    [notifications, activeCategory]
  );

  async function openNotification(notification) {
    setSelected(notification);
    if (notification.read) return;

    // Optimistic - the badge should drop the moment it is opened.
    setAllNotifications((prev) =>
      prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
    );
    setSummary((prev) => ({ ...prev, unread: Math.max((prev.unread || 1) - 1, 0) }));
    try {
      await api.post(`/notifications/${notification._id}/read`);
      loadSummary();
    } catch {
      /* the optimistic update is good enough for the panel */
    }
  }

  function goToNotification(notification) {
    setOpen(false);
    if (notification.link) navigate(notification.link);
  }

  async function markAllRead() {
    const body = activeCategory ? { category: activeCategory } : {};
    setAllNotifications((prev) =>
      prev.map((n) =>
        canSeeCategory(n.category, role) && (!activeCategory || n.category === activeCategory)
          ? { ...n, read: true }
          : n
      )
    );
    try {
      await api.post("/notifications/read-all", body);
    } finally {
      loadSummary();
    }
  }

  // The summary endpoint counts every category, so subtract any the current
  // role is not allowed to see - otherwise the badge could show a number the
  // user can never open or clear.
  const unread = useMemo(() => {
    let total = summary.unread || 0;
    for (const [key, count] of Object.entries(summary.byCategory || {})) {
      if (!canSeeCategory(key, role)) total -= count;
    }
    return Math.max(total, 0);
  }, [summary, role]);

  return (
    <div className="notif-wrap" ref={panelRef}>
      <button
        type="button"
        className="notif-bell"
        onClick={togglePanel}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
      >
        <Bell size={17} />
        {unread > 0 && <span className="notif-count">{unread > 99 ? "99+" : unread}</span>}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-head">
            {selected ? (
              <button type="button" className="notif-back" onClick={() => setSelected(null)}>
                <ChevronLeft size={15} /> Back
              </button>
            ) : activeCategory ? (
              <button type="button" className="notif-back" onClick={() => setActiveCategory(null)}>
                <ChevronLeft size={15} /> All categories
              </button>
            ) : (
              <strong>Notifications</strong>
            )}

            {!selected && (
              <button type="button" className="notif-mark-all" onClick={markAllRead}>
                <CheckCheck size={14} /> Mark read
              </button>
            )}
          </div>

          <div className="notif-panel-body">
            {loading && <p className="notif-empty">Loading...</p>}

            {/* ---- Level 3: one notification in full ---- */}
            {!loading && selected && (
              <div className="notif-detail">
                <span className="notif-detail-cat">
                  {CATEGORY_MAP[selected.category]?.label || selected.category}
                </span>
                <h4>{selected.title}</h4>
                <p className="notif-detail-time">{timeAgo(selected.createdAt)}</p>
                <p className="notif-detail-msg">{selected.message}</p>
                {selected.deadline_at && (
                  <p className="notif-detail-deadline">
                    <Clock size={13} /> Due {new Date(selected.deadline_at).toLocaleString()}
                  </p>
                )}
                {selected.link && (
                  <button
                    type="button"
                    className="btn-small notif-goto"
                    onClick={() => goToNotification(selected)}
                  >
                    Go to page <ArrowUpRight size={14} />
                  </button>
                )}
              </div>
            )}

            {/* ---- Level 1: the category list ---- */}
            {!loading && !selected && !activeCategory && (
              <>
                {categories.length === 0 && (
                  <p className="notif-empty">
                    <Inbox size={26} />
                    <span>You're all caught up.</span>
                  </p>
                )}
                {categories.map(({ key, label, icon: Icon, total, unread: catUnread }) => (
                  <button
                    type="button"
                    key={key}
                    className="notif-cat-row"
                    onClick={() => setActiveCategory(key)}
                  >
                    <span className="notif-cat-icon">
                      <Icon size={16} />
                    </span>
                    <span className="notif-cat-text">
                      <strong>{label}</strong>
                      <small>
                        {total} notification{total === 1 ? "" : "s"}
                      </small>
                    </span>
                    {catUnread > 0 && <span className="notif-pill">{catUnread}</span>}
                    <ChevronRight size={15} className="notif-chevron" />
                  </button>
                ))}
              </>
            )}

            {/* ---- Level 2: the notifications inside a category ---- */}
            {!loading && !selected && activeCategory && (
              <>
                <p className="notif-section-title">{CATEGORY_MAP[activeCategory]?.label}</p>
                {visible.length === 0 && <p className="notif-empty">Nothing here yet.</p>}
                {visible.map((n) => (
                  <button
                    type="button"
                    key={n._id}
                    className={`notif-row${n.read ? "" : " notif-row-unread"}`}
                    onClick={() => openNotification(n)}
                  >
                    <span className="notif-row-body">
                      <strong>{n.title}</strong>
                      <small>{n.message}</small>
                      <em>{timeAgo(n.createdAt)}</em>
                    </span>
                    {n.action_required && !n.read && <span className="notif-action-dot" title="Action required" />}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
