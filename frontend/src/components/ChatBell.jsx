// Navbar chat icon, beside the notification bell. Red unread count, and a
// dropdown listing every project chat this user belongs to.
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, ChevronRight, Users, Archive } from "lucide-react";
import { api } from "../api";

const POLL_MS = 45 * 1000;

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

export default function ChatBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);

  const panelRef = useRef(null);
  const navigate = useNavigate();

  const loadUnread = useCallback(() => {
    api
      .get("/chats/unread-count")
      .then((d) => setUnread(d.unread || 0))
      .catch(() => {});
  }, []);

  const loadChats = useCallback(() => {
    setLoading(true);
    api
      .get("/chats")
      .then((d) => setChats(d.chats || []))
      .catch(() => setChats([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadUnread();
    const timer = setInterval(loadUnread, POLL_MS);
    return () => clearInterval(timer);
  }, [loadUnread]);

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

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      loadChats();
      loadUnread();
    }
  }

  function goToChat(chat) {
    setOpen(false);
    navigate(`/chats/${chat.project?._id}`);
  }

  return (
    <div className="notif-wrap" ref={panelRef}>
      <button
        type="button"
        className="notif-bell chat-bell-btn"
        onClick={toggle}
        aria-label={`Project team chats${unread ? ` (${unread} unread)` : ""}`}
      >
        <MessageCircle size={19} aria-hidden="true" />
        {unread > 0 && <span className="notif-count">{unread > 99 ? "99+" : unread}</span>}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-head">
            <strong>Project channels</strong>
          </div>

          <div className="notif-panel-body">
            {loading && (
              <p className="notif-empty">
                <span className="spinner" aria-hidden="true" /> Loading channels
              </p>
            )}

            {!loading && chats.length === 0 && (
              <p className="notif-empty">
                <Users size={24} aria-hidden="true" />
                <span>No project channels yet. One opens as soon as a field team is assigned.</span>
              </p>
            )}

            {!loading &&
              chats.map((c) => (
                <button type="button" key={c._id} className="notif-row" onClick={() => goToChat(c)}>
                  <span className="notif-row-body">
                    <strong>
                      {c.project?.p_name}
                      {c.archived && <Archive size={11} style={{ marginLeft: "0.35rem", verticalAlign: "middle" }} />}
                    </strong>
                    <small>
                      {c.lastMessage
                        ? c.lastMessage.text || (c.lastMessage.image ? "Sent a photo" : "")
                        : "No messages yet"}
                    </small>
                    <em>{c.lastMessage ? timeAgo(c.lastMessage.createdAt) : ""}</em>
                  </span>
                  {c.unread > 0 && <span className="notif-pill">{c.unread}</span>}
                  <ChevronRight size={15} className="notif-chevron" aria-hidden="true" />
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
