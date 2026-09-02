// Ahad_23201016 - Tender Bidding System (Excavation Team):
// view bid status (Pending, Accepted, Rejected) and edit/withdraw before the deadline.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Banknote, CalendarClock, Edit, XCircle, X } from "lucide-react";
import { api } from "../../api";
import StatusBadge from "../../components/StatusBadge";

const STATUS_COLORS = {
  Pending: "#8a5a12",
  Accepted: "#1f6b2e",
  Rejected: "#b02020",
  Withdrawn: "#9b8e7d",
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
      setSuccess("Bid revised.");
      load();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function withdraw(bid) {
    if (!window.confirm("Withdraw this bid? You may submit again while the tender remains open."))
      return;
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
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading your bids
        </div>
      </div>
    );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Procurement</span>
          <h1>Submitted bids</h1>
          <p className="page-subtitle">
            Every bid your company has lodged and where it stands. Bids may be revised or withdrawn
            until the tender closes.
          </p>
        </div>
        <Link className="btn btn-secondary" to="/et/tenders">
          Browse open tenders
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {bids.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={26} aria-hidden="true" />
          <h3>No bids lodged</h3>
          <p>Bids you submit against published tenders are tracked here.</p>
          <Link className="btn" to="/et/tenders">
            Browse open tenders
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {bids.map((b) => (
            <div
              key={b._id}
              className="card"
              style={{
                margin: 0,
                borderLeft: `3px solid ${STATUS_COLORS[b.status] || "var(--border-strong)"}`,
              }}
            >
              <div className="report-header">
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ margin: "0 0 0.2rem" }}>{b.tender?.title || "Tender withdrawn"}</h3>
                  <p className="meta-row">
                    <span>Lodged {new Date(b.submitted_at).toLocaleDateString()}</span>
                    {b.tender?.location?.address && <span>{b.tender.location.address}</span>}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </div>

              <dl className="detail-list" style={{ margin: "1.1rem 0" }}>
                <div>
                  <dt>
                    <Banknote size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Your price
                  </dt>
                  <dd className="num">৳{b.cost?.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>
                    <CalendarClock size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Programme
                  </dt>
                  <dd className="num">{b.timeline_days} days</dd>
                </div>
                {b.tender?.estimated_budget != null && (
                  <div>
                    <dt>Authority estimate</dt>
                    <dd className="num">৳{b.tender.estimated_budget.toLocaleString()}</dd>
                  </div>
                )}
                {b.tender?.deadline && (
                  <div>
                    <dt>Closes</dt>
                    <dd className="num">{new Date(b.tender.deadline).toLocaleDateString()}</dd>
                  </div>
                )}
              </dl>

              <p style={{ fontSize: "0.9375rem" }}>{b.proposal}</p>

              {b.status === "Accepted" && (
                <div className="alert alert-success">
                  <span>
                    Your bid was accepted. The excavation is now live under{" "}
                    <Link to="/et/projects">your project register</Link>.
                  </span>
                </div>
              )}
              {b.status === "Rejected" && b.review_notes && (
                <div className="alert alert-danger">{b.review_notes}</div>
              )}

              {canModify(b) && (
                <div
                  className="actions"
                  style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}
                >
                  <button className="btn-small btn-secondary" onClick={() => openEdit(b)}>
                    <Edit size={13} aria-hidden="true" /> Revise bid
                  </button>
                  <button className="btn-small btn-danger" onClick={() => withdraw(b)}>
                    <XCircle size={13} aria-hidden="true" /> Withdraw bid
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-head">
              <div>
                <span className="eyebrow">Tender bid</span>
                <h2>Revise your bid</h2>
              </div>
              <button className="modal-close" onClick={() => setEditing(null)} aria-label="Close">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <p className="hint">{editing.tender?.title}</p>
            {modalError && <div className="alert alert-danger">{modalError}</div>}

            <form onSubmit={saveEdit} className="form">
              <div className="form-row">
                <label>
                  Bid price (৳)
                  <input
                    type="number"
                    min="0"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Programme (days)
                  <input
                    type="number"
                    min="1"
                    value={form.timeline_days}
                    onChange={(e) => setForm({ ...form, timeline_days: e.target.value })}
                    required
                  />
                </label>
              </div>
              <label>
                Method statement
                <textarea
                  rows={5}
                  value={form.proposal}
                  onChange={(e) => setForm({ ...form, proposal: e.target.value })}
                  required
                />
              </label>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)} disabled={busy}>
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={busy}>
                  {busy ? "Saving" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
