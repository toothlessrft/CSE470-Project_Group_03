// Project Team Group Chat (Archaeologist & Excavation Team)
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Send, Image as ImageIcon, UserPlus, X, Archive, Users } from "lucide-react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";

const POLL_MS = 8000;

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fmtTime(value) {
  return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function TeamChatPage() {
  const { projectId } = useParams();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [sending, setSending] = useState(false);
  const [nid, setNid] = useState("");
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState("");
  const [showParticipants, setShowParticipants] = useState(false);

  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const messageCountRef = useRef(0);

  const load = useCallback(
    (silent = false) => {
      if (!silent) setLoading(true);
      api
        .get(`/chats/${projectId}`)
        .then((d) => {
          setData(d);
          setError("");
          if (d.messages.length !== messageCountRef.current) {
            messageCountRef.current = d.messages.length;
            api.post(`/chats/${projectId}/read`).catch(() => {});
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    },
    [projectId]
  );

  useEffect(() => {
    load();
    const timer = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages?.length]);

  async function handleImagePick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      alert("Please choose an image under 1 MB.");
      e.target.value = "";
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setImage(dataUrl);
    e.target.value = "";
  }

  async function send(e) {
    e.preventDefault();
    if (!text.trim() && !image) return;
    setSending(true);
    setError("");
    try {
      const d = await api.post(`/chats/${projectId}/messages`, { text: text.trim(), image });
      setData((prev) => ({ ...prev, messages: [...prev.messages, d.message] }));
      messageCountRef.current += 1;
      setText("");
      setImage("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function addParticipant(e) {
    e.preventDefault();
    setAddError("");
    setAddBusy(true);
    try {
      await api.post(`/chats/${projectId}/participants`, { nid });
      setNid("");
      load();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddBusy(false);
    }
  }

  async function removeParticipant(userId) {
    if (!window.confirm("Remove this member from the group chat?")) return;
    try {
      await api.del(`/chats/${projectId}/participants/${userId}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading && !data) return <div className="page"><p className="hint">Loading chat...</p></div>;
  if (!data)
    return (
      <div className="page">
        <div className="alert alert-danger">{error || "Chat not found."}</div>
      </div>
    );

  const { project, chat, messages, permissions } = data;

  return (
    <div className="page">
      <p>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
          <ArrowLeft size={14} /> Back
        </Link>
      </p>

      <div className="chat-shell">
        <div className="chat-main card" style={{ padding: 0 }}>
          <div className="chat-header">
            <div>
              <h2 style={{ margin: 0 }}>{project.p_name}</h2>
              <p className="hint" style={{ margin: 0 }}>
                {chat.participants.length} member{chat.participants.length === 1 ? "" : "s"}
                {chat.archived ? " · Archived" : ""}
              </p>
            </div>
            <button type="button" className="btn-small btn-outline-light" onClick={() => setShowParticipants((s) => !s)}>
              <Users size={14} /> Members
            </button>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ margin: "0 1.1rem" }}>
              {error}
            </div>
          )}
          {chat.archived && (
            <div className="alert alert-info" style={{ margin: "0 1.1rem" }}>
              <Archive size={14} style={{ verticalAlign: "middle" }} /> This project is complete, so the chat is
              archived (read-only) but stays in your chat history.
            </div>
          )}

          <div className="chat-messages">
            {messages.length === 0 && <p className="hint">No messages yet. Say hello!</p>}
            {messages.map((m) =>
              m.system ? (
                <div key={m._id} className="chat-msg-system">
                  <span>{m.text}</span>
                </div>
              ) : (
                <div
                  key={m._id}
                  className={`chat-msg ${String(m.sender?._id) === String(user.id) ? "chat-msg-mine" : ""}`}
                >
                  <div className="chat-bubble">
                    <div className="chat-bubble-meta">
                      <strong>{m.sender?.name}</strong>
                      <span className="chat-bubble-role">{(m.sender?.role || "").replace("_", " ")}</span>
                    </div>
                    {m.image && <img src={m.image} alt="attachment" className="chat-bubble-image" />}
                    {m.text && <p>{m.text}</p>}
                    <span className="chat-bubble-time">{fmtTime(m.createdAt)}</span>
                  </div>
                </div>
              )
            )}
            <div ref={bottomRef} />
          </div>

          {!chat.archived && (
            <form onSubmit={send} className="chat-composer">
              {image && (
                <div className="chat-composer-preview">
                  <img src={image} alt="preview" />
                  <button type="button" onClick={() => setImage("")}>
                    <X size={12} />
                  </button>
                </div>
              )}
              <button
                type="button"
                className="btn-small btn-outline-light"
                onClick={() => fileRef.current?.click()}
                title="Attach image"
                style={{ padding: "0.6rem", flexShrink: 0 }}
              >
                <ImageIcon size={15} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImagePick} />
              <input
                type="text"
                placeholder="Write a project update..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn-small" disabled={sending || (!text.trim() && !image)}>
                <Send size={14} />
              </button>
            </form>
          )}
        </div>

        {showParticipants && (
          <div className="chat-side card">
            <h4 style={{ marginTop: 0 }}>Members</h4>
            <ul className="chat-participant-list">
              {chat.participants.map((p) => (
                <li key={p.user._id}>
                  <span>
                    <strong>{p.user.name}</strong>
                    <br />
                    <small className="hint">
                      {(p.role || "").replace("_", " ")} · {p.user.nid}
                    </small>
                  </span>
                  {permissions.canManageParticipants && !chat.archived && p.user._id !== user.id && (
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => removeParticipant(p.user._id)}
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {permissions.canManageParticipants && !chat.archived && (
              <form onSubmit={addParticipant} className="form" style={{ marginTop: "1rem" }}>
                {addError && (
                  <div className="alert alert-danger" style={{ padding: "0.5rem 0.75rem", fontSize: "0.8rem" }}>
                    {addError}
                  </div>
                )}
                <label>
                  Add member by NID
                  <input value={nid} onChange={(e) => setNid(e.target.value)} placeholder="e.g. A004" required />
                </label>
                <button type="submit" className="btn-small" disabled={addBusy}>
                  <UserPlus size={14} /> {addBusy ? "Adding..." : "Add"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
