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
      <h1>Browse Excavation Tenders</h1>
      <p className="page-subtitle">Review open excavation tenders and submit a bid before the deadline.</p>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : tenders.length === 0 ? (
        <div className="card">No open tenders right now. Check back later.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {tenders.map((t) => (
            <div className="card" key={t._id}>
              <div className="report-header">
                <strong>{t.title}</strong>
                {t.myBid ? <StatusBadge status={t.myBid.status} /> : <StatusBadge status="Open" />}
              </div>
              <p>{t.description}</p>
              <p>
                <strong>Location:</strong> {t.site?.name || t.location}
              </p>
              {t.requirements && (
                <p>
                  <strong>Requirements:</strong> {t.requirements}
                </p>
              )}
              <p>
                <strong>Estimated budget:</strong> ৳{t.estimated_budget} &nbsp;
                <strong>Deadline:</strong> {new Date(t.deadline).toLocaleDateString()}
              </p>

              {t.myBid && (
                <div className="alert alert-success" style={{ margin: "0.5rem 0" }}>
                  You bid ৳{t.myBid.cost} — {t.myBid.timeline}. Status: {t.myBid.status}
                </div>
              )}

              {openFormId === t._id ? (
                <div className="form">
                  <label>
                    Your cost (BDT)
                    <input
                      type="number"
                      min="0"
                      value={forms[t._id]?.cost ?? ""}
                      onChange={(e) => updateForm(t._id, { cost: e.target.value })}
                    />
                  </label>
                  <label>
                    Timeline
                    <input
                      value={forms[t._id]?.timeline ?? ""}
                      onChange={(e) => updateForm(t._id, { timeline: e.target.value })}
                      placeholder="e.g. 5 weeks"
                    />
                  </label>
                  <label>
                    Proposal
                    <textarea
                      rows={3}
                      value={forms[t._id]?.proposal ?? ""}
                      onChange={(e) => updateForm(t._id, { proposal: e.target.value })}
                      placeholder="Describe your crew, experience, and approach."
                    />
                  </label>
                  <div className="actions">
                    <button className="btn-small" disabled={busyId === t._id} onClick={() => submitBid(t)}>
                      {busyId === t._id ? "Saving..." : t.myBid ? "Update Bid" : "Submit Bid"}
                    </button>
                    <button className="btn-small btn-deny" onClick={() => setOpenFormId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="actions">
                  <button className="btn-small" onClick={() => startForm(t)}>
                    {t.myBid ? "Edit Bid" : "Submit Bid"}
                  </button>
                  {t.myBid && t.myBid.status === "Pending" && (
                    <button className="btn-small btn-deny" disabled={busyId === t._id} onClick={() => withdrawBid(t)}>
                      Withdraw Bid
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
