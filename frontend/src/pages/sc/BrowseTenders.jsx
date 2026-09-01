// Tender Bidding System (Excavation Team): Ahad_23201016
import { useEffect, useState } from "react";
import { api } from "../../api";
import StatusBadge from "../../components/StatusBadge";

export default function BrowseTenders() {
  const [tenders, setTenders] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [openFormId, setOpenFormId] = useState(null);
  const [forms, setForms] = useState({}); // tenderId -> { cost, timeline, proposal }
  const [busyId, setBusyId] = useState(null);

  function load() {
    setLoading(true);
    api
      .get("/sc/tenders")
      .then((data) => setTenders(data.tenders))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function startForm(t) {
    setOpenFormId(t._id);
    setForms((prev) => ({
      ...prev,
      [t._id]: prev[t._id] || {
        cost: t.myBid?.cost ?? "",
        timeline: t.myBid?.timeline ?? "",
        proposal: t.myBid?.proposal ?? "",
      },
    }));
  }

  function updateForm(tenderId, patch) {
    setForms((prev) => ({ ...prev, [tenderId]: { ...prev[tenderId], ...patch } }));
  }

  async function submitBid(t) {
    const form = forms[t._id];
    setError("");
    setSuccess("");
    if (!form?.cost || !form?.timeline || !form?.proposal) {
      setError("Please fill in cost, timeline, and proposal.");
      return;
    }
    setBusyId(t._id);
    try {
      if (t.myBid) {
        await api.patch(`/sc/tenders/${t._id}/bid`, {
          cost: Number(form.cost),
          timeline: form.timeline,
          proposal: form.proposal,
        });
        setSuccess("Bid updated.");
      } else {
        await api.post(`/sc/tenders/${t._id}/bid`, {
          cost: Number(form.cost),
          timeline: form.timeline,
          proposal: form.proposal,
        });
        setSuccess("Bid submitted.");
      }
      setOpenFormId(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function withdrawBid(t) {
    if (!window.confirm("Withdraw your bid for this tender?")) return;
    setError("");
    setSuccess("");
    setBusyId(t._id);
    try {
      await api.del(`/sc/tenders/${t._id}/bid`);
      setSuccess("Bid withdrawn.");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Procurement</span>
          <h1>Open tenders</h1>
          <p className="page-subtitle">
            Excavation contracts open for bidding. Bids may be revised until the closing date.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading open tenders
        </div>
      ) : tenders.length === 0 ? (
        <div className="empty-state">
          <h3>No tenders open</h3>
          <p>Nothing is currently out to tender. New contracts appear here as they are published.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {tenders.map((t) => (
            <div className="card" key={t._id}>
              <div className="report-header">
                <h3 style={{ margin: 0 }}>{t.title}</h3>
                {t.myBid ? <StatusBadge status={t.myBid.status} /> : <StatusBadge status="Open" />}
              </div>

              <p style={{ fontSize: "0.9375rem" }}>{t.description}</p>

              {t.requirements && (
                <div className="subtle" style={{ marginBottom: "1rem" }}>
                  <span className="stat-label">Requirements</span>
                  <p style={{ margin: "0.2rem 0 0", fontSize: "0.875rem" }}>{t.requirements}</p>
                </div>
              )}

              <dl className="detail-list" style={{ margin: "1rem 0" }}>
                <div>
                  <dt>Location</dt>
                  <dd>{t.site?.name || t.location}</dd>
                </div>
                <div>
                  <dt>Estimated budget</dt>
                  <dd className="num">৳{Number(t.estimated_budget || 0).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Bids close</dt>
                  <dd className="num">{new Date(t.deadline).toLocaleDateString()}</dd>
                </div>
              </dl>

              {t.myBid && (
                <div className="alert alert-info">
                  <span>
                    Your bid: ৳{Number(t.myBid.cost || 0).toLocaleString()} over {t.myBid.timeline} ·
                    status <strong>{t.myBid.status}</strong>.
                  </span>
                </div>
              )}

              {openFormId === t._id ? (
                <div className="form">
                  <div className="form-row">
                    <label>
                      Bid price (৳)
                      <input
                        type="number"
                        min="0"
                        value={forms[t._id]?.cost ?? ""}
                        onChange={(e) => updateForm(t._id, { cost: e.target.value })}
                      />
                    </label>
                    <label>
                      Programme
                      <input
                        value={forms[t._id]?.timeline ?? ""}
                        onChange={(e) => updateForm(t._id, { timeline: e.target.value })}
                        placeholder="e.g. 5 weeks"
                      />
                    </label>
                  </div>
                  <label>
                    Method statement
                    <textarea
                      rows={3}
                      value={forms[t._id]?.proposal ?? ""}
                      onChange={(e) => updateForm(t._id, { proposal: e.target.value })}
                      placeholder="Crew, relevant experience, and how you would approach the site"
                    />
                  </label>
                  <div className="actions">
                    <button className="btn-small" disabled={busyId === t._id} onClick={() => submitBid(t)}>
                      {busyId === t._id ? "Saving" : t.myBid ? "Save revision" : "Submit bid"}
                    </button>
                    <button className="btn-small btn-secondary" onClick={() => setOpenFormId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="actions"
                  style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}
                >
                  <button className="btn-small" onClick={() => startForm(t)}>
                    {t.myBid ? "Revise bid" : "Submit a bid"}
                  </button>
                  {t.myBid && t.myBid.status === "Pending" && (
                    <button
                      className="btn-small btn-danger"
                      disabled={busyId === t._id}
                      onClick={() => withdrawBid(t)}
                    >
                      Withdraw bid
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
