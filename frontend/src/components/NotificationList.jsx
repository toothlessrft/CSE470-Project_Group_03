// Role-Based Notification & Reminder System - inline inbox.
//
// The Government/Admin has no navbar bell, so this renders the same three-level
// drill-down (categories -> list -> full notification) directly on the Admin
// Dashboard. Crucially it reads the *whole* inbox, so notifications that carry
// no dashboard_key - and therefore have no card badge to live under - are still
// visible here rather than silently swallowed.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Gavel,
  CalendarDays,
  FileText,
  ClipboardCheck,
  MapPinned,
  FileSignature,
  Clock,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  ArrowUpRight,
  Inbox,
} from "lucide-react";
import { api } from "../api";

const CATEGORY_LABELS = [
  { key: "auction", label: "Auction Updates", icon: Gavel },
  { key: "event", label: "Exhibitions & Events", icon: CalendarDays },
  { key: "report", label: "Report Status", icon: FileText },
  { key: "request", label: "Requests & Approvals", icon: ClipboardCheck },
  { key: "assignment", label: "Assignments & Transfers", icon: MapPinned },
  { key: "tender", label: "Tenders & Bids", icon: FileSignature },
  { key: "reminder", label: "Deadline Reminders", icon: Clock },
  { key: "account", label: "Account & System", icon: UserCheck },
];
const CATEGORY_MAP = Object.fromEntries(CATEGORY_LABELS.map((c) => [c.key, c]));

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

export default function NotificationList({ onChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    api
      .get("/notifications?limit=200")
      .then((data) => setNotifications(data.notifications || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const categories = useMemo(() => {
    const total = {};
    const unread = {};
    for (const n of notifications) {
      total[n.category] = (total[n.category] || 0) + 1;
      if (!n.read) unread[n.category] = (unread[n.category] || 0) + 1;
    }
    return CATEGORY_LABELS.filter((c) => total[c.key]).map((c) => ({
      ...c,
      total: total[c.key],
      unread: unread[c.key] || 0,
    }));
  }, [notifications]);

  const visible = useMemo(
    () => notifications.filter((n) => n.category === activeCategory),
    [notifications, activeCategory]
  );

  const unreadTotal = notifications.filter((n) => !n.read).length;

  async function openNotification(notification) {
    setSelected(notification);
    if (notification.read) return;
    setNotifications((prev) =>
      prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
    );
    try {
      await api.post(`/notifications/${notification._id}/read`);
    } finally {
      onChange?.();
    }
  }

  async function markAllRead() {
    const body = activeCategory ? { category: activeCategory } : {};
    setNotifications((prev) =>
      prev.map((n) => (!activeCategory || n.category === activeCategory ? { ...n, read: true } : n))
    );
    try {
      await api.post("/notifications/read-all", body);
    } finally {
      onChange?.();
    }
  }

  return (
    <div className="notif-inline">
      <div className="notif-inline-head">
        {selected ? (
          <button type="button" className="notif-back" onClick={() => setSelected(null)}>
            <ChevronLeft size={15} /> Back
          </button>
        ) : activeCategory ? (
          <button type="button" className="notif-back" onClick={() => setActiveCategory(null)}>
            <ChevronLeft size={15} /> All categories
          </button>
        ) : (
          <strong>
            All Notifications
            {unreadTotal > 0 && <span className="notif-pill">{unreadTotal}</span>}
          </strong>
        )}

        {!selected && (
          <button type="button" className="notif-mark-all" onClick={markAllRead}>
            <CheckCheck size={14} /> Mark read
          </button>
        )}
      </div>

      <div className="notif-inline-body">
        {loading && <p className="notif-empty">Loading...</p>}

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
                onClick={() => navigate(selected.link)}
              >
                Go to page <ArrowUpRight size={14} />
              </button>
            )}
          </div>
        )}

        {!loading && !selected && !activeCategory && (
          <>
            {categories.length === 0 && (
              <p className="notif-empty">
                <Inbox size={26} />
                <span>No notifications yet.</span>
              </p>
            )}
            {categories.map(({ key, label, icon: Icon, total, unread }) => (
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
                {unread > 0 && <span className="notif-pill">{unread}</span>}
                <ChevronRight size={15} className="notif-chevron" />
              </button>
            ))}
          </>
        )}

        {!loading && !selected && activeCategory && (
          <>
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
                {n.action_required && !n.read && <span className="notif-action-dot" />}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
