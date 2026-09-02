// Ahad_23201016 - Tender Bidding System (Excavation Team):
// view bid status (Pending, Accepted, Rejected) and edit/withdraw before the deadline.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Banknote, CalendarClock, Edit, XCircle, X } from "lucide-react";
import { api } from "../../api";
import StatusBadge from "../../components/StatusBadge";

const STATUS_COLORS = {
  Pending: "#b5834d",
  Accepted: "#2e7d32",
  Rejected: "#c62828",
  Withdrawn: "#6b6258",
};

export default function MyBids() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ cost: "", timeline_days: "", proposal: "" });
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState("");

  function load() {
    setLoading(true);
    api
      .get("/tenders/my-bids")
      .then((data) => setBids(data.bids))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function canModify(bid) {
    if (bid.status === "Accepted" || bid.status === "Rejected") return false;
    if (!bid.tender) return false;
    if (bid.tender.status !== "Open") return false;
    return new Date(bid.tender.deadline).getTime() > Date.now();
  }

  function openEdit(bid) {
    setEditing(bid);
    setModalError("");
    setForm({ cost: bid.cost, timeline_days: bid.timeline_days, proposal: bid.proposal });
  }

  async function saveEdit(e) {
    e.preventDefault();
    setModalError("");
    setBusy(true);
    try {
      await api.patch(`/tenders/bids/${editing._id}`, form);
      setEditing(null);
      setSuccess("Bid updated.");
      load();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function withdraw(bid) {
    if (!window.confirm("Withdraw this bid? You can re-submit while the tender is still open.")) return;
    setError("");
    try {
      await api.del(`/tenders/bids/${bid._id}`);
      setSuccess("Bid withdrawn.");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading)
    return (
      <div className="page">
        <p className="hint">Loading bids...</p>
      </div>
    );

  return (
    <div className="page">
      <h1>My Bids</h1>
      <p className="page-subtitle">
        Every bid your company has placed, with its current status. Bids can be edited or withdrawn
        right up until the tender deadline.
      </p>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {bids.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
          <ClipboardList size={28} style={{ marginBottom: "0.5rem" }} />
          <p style={{ margin: 0 }}>
            You haven't bid on anything yet. <Link to="/et/tenders">Browse open tenders</Link>.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {bids.map((b) => (
            <div
              key={b._id}
              className="card"
              style={{
                margin: 0,
                borderLeft: `4px solid ${STATUS_COLORS[b.status] || "var(--border)"}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h3 style={{ margin: "0 0 0.2rem", fontSize: "1.05rem" }}>
                    {b.tender?.title || "Tender removed"}
                  </h3>
                  <p className="hint" style={{ margin: 0 }}>
                    Submitted {new Date(b.submitted_at).toLocaleDateString()}
                    {b.tender?.location?.address ? ` · ${b.tender.location.address}` : ""}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "1.5rem",
                  flexWrap: "wrap",
                  margin: "1rem 0",
                  fontSize: "0.88rem",
                  color: "var(--muted)",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Banknote size={15} /> My bid:{" "}
                  <strong style={{ color: "var(--text)" }}>৳{b.cost?.toLocaleString()}</strong>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <CalendarClock size={15} /> Timeline:{" "}
                  <strong style={{ color: "var(--text)" }}>{b.timeline_days} days</strong>
                </span>
                {b.tender?.estimated_budget != null && (
                  <span>Govt. estimate: ৳{b.tender.estimated_budget.toLocaleString()}</span>
                )}
                {b.tender?.deadline && (
                  <span>Closes {new Date(b.tender.deadline).toLocaleDateString()}</span>
                )}
              </div>

              <p style={{ fontSize: "0.9rem" }}>{b.proposal}</p>

              {b.status === "Accepted" && (
                <div className="alert alert-success">
                  Your team won this tender. The excavation is now live under{" "}
                  <Link to="/et/projects">Manage Projects</Link>.
                </div>
              )}
              {b.status === "Rejected" && b.review_notes && (
                <div className="alert alert-danger">{b.review_notes}</div>
              )}

              {canModify(b) && (
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                    borderTop: "1px solid var(--border)",
                    paddingTop: "1rem",
                  }}
                >
                  <button className="btn-small" onClick={() => openEdit(b)}>
                    <Edit size={13} /> Edit Bid
                  </button>
                  <button
                    className="btn-small"
                    style={{ background: "var(--danger)", border: "none", color: "white" }}
                    onClick={() => withdraw(b)}
                  >
                    <XCircle size={13} /> Withdraw
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", margin: 0 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h2 style={{ margin: 0 }}>Edit Bid</h2>
              <button className="btn-link" onClick={() => setEditing(null)}>
                <X size={20} />
              </button>
            </div>

            <p className="hint">{editing.tender?.title}</p>
            {modalError && <div className="alert alert-danger">{modalError}</div>}

            <form onSubmit={saveEdit} className="form">
              <label>
                Bid Cost (৳)
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  required
                />
              </label>
              <label>
                Timeline (days)
                <input
                  type="number"
                  min="1"
                  value={form.timeline_days}
                  onChange={(e) => setForm({ ...form, timeline_days: e.target.value })}
                  required
                />
              </label>
              <label>
                Proposal
                <textarea
                  rows={5}
                  value={form.proposal}
                  onChange={(e) => setForm({ ...form, proposal: e.target.value })}
                  required
                />
              </label>
              <button type="submit" className="btn" disabled={busy}>
                {busy ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
