// Ahad_23201016 - Tender Publication & Management (Government):
// view all submitted bids, evaluate them, and assign the winning excavation team.
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Banknote,
  CalendarClock,
  MapPin,
  Users,
  Trophy,
  XCircle,
  Ban,
  Clock,
  ArrowRight,
} from "lucide-react";
import { api } from "../../api";
import GoogleMapPicker from "../../components/GoogleMapPicker";
import StatusBadge from "../../components/StatusBadge";
import StarRating from "../../components/StarRating";

export default function TenderDetail() {
  const { id } = useParams();
  const [tender, setTender] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [ratings, setRatings] = useState({});

  function load() {
    setLoading(true);
    api
      .get(`/tenders/admin/${id}`)
      .then((data) => {
        setTender(data.tender);
        setBids(data.bids);
        const ids = data.bids.map((b) => b.team?._id).filter(Boolean).join(",");
        if (ids) api.get(`/reviews/ratings?ids=${ids}`).then((r) => setRatings(r.ratings));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function awardBid(bid) {
    if (
      !window.confirm(
        `Assign this excavation to ${bid.company_name} for ৳${bid.cost.toLocaleString()}? This closes the tender, rejects the other bids, and creates the active project.`
      )
    )
      return;
    setError("");
    setBusyId(bid._id);
    try {
      await api.post(`/tenders/admin/${id}/award`, { bid_id: bid._id });
      setSuccess(`${bid.company_name} has been assigned. The excavation project is now active.`);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function rejectBid(bid) {
    if (!window.confirm(`Reject the bid from ${bid.company_name}?`)) return;
    setError("");
    setBusyId(bid._id);
    try {
      await api.post(`/tenders/admin/bids/${bid._id}/reject`, {});
      setSuccess(`Bid from ${bid.company_name} rejected.`);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function cancelTender() {
    setError("");
    try {
      await api.post(`/tenders/admin/${id}/cancel`, { reason: cancelReason });
      setShowCancel(false);
      setSuccess("Tender cancelled.");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading)
    return (
      <div className="page">
        <p className="hint">Loading tender...</p>
      </div>
    );
  if (!tender)
    return (
      <div className="page">
        <div className="alert alert-danger">{error || "Tender not found."}</div>
      </div>
    );

  const isOpen = tender.status === "Open";
  const deadlinePassed = new Date(tender.deadline).getTime() <= Date.now();
  const liveBids = bids.filter((b) => b.status !== "Withdrawn");
  const lowest = liveBids.length ? Math.min(...liveBids.map((b) => b.cost)) : null;
  const fastest = liveBids.length ? Math.min(...liveBids.map((b) => b.timeline_days)) : null;

  return (
    <div className="page">
      <Link className="back-link" to="/admin/tenders">
        <ArrowLeft size={14} aria-hidden="true" /> Back to tenders
      </Link>

      <div className="page-head">
        <div>
          <span className="eyebrow">Excavation tender</span>
          <h1>{tender.title}</h1>
        </div>
        <StatusBadge status={tender.status === "Open" ? "Active" : tender.status} />
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {isOpen && deadlinePassed && (
        <div className="alert alert-info">
          <Clock size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            Bidding has closed. No further bids can be lodged or revised — evaluate the submissions
            below and award the contract.
          </span>
        </div>
      )}

      {tender.status === "Awarded" && tender.awarded_team && (
        <div className="alert alert-success">
          <Trophy size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            Awarded to <strong>{tender.awarded_team.company_name}</strong>, represented by{" "}
            {tender.awarded_team.representative}, on{" "}
            {new Date(tender.awarded_at).toLocaleDateString()}.{" "}
            {tender.project && (
              <Link to="/admin/excavation-projects">
                Open the active project{" "}
                <ArrowRight size={12} aria-hidden="true" style={{ verticalAlign: "middle" }} />
              </Link>
            )}
          </span>
        </div>
      )}

      {tender.status === "Cancelled" && (
        <div className="alert alert-danger">
          This tender was cancelled. {tender.cancel_reason}
        </div>
      )}

      {/* Tender details */}
      <div className="panel">
        <div className="panel-head">
          <h3>Tender particulars</h3>
        </div>
        <div className="panel-body">
          <dl className="detail-list">
            <div>
              <dt>
                <Banknote size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Estimated budget
              </dt>
              <dd className="num">৳{tender.estimated_budget?.toLocaleString()}</dd>
            </div>
            <div>
              <dt>
                <CalendarClock size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Bids close
              </dt>
              <dd className="num">{new Date(tender.deadline).toLocaleString()}</dd>
            </div>
            <div>
              <dt>
                <Users size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Live bids
              </dt>
              <dd className="num">{liveBids.length}</dd>
            </div>
          </dl>

          <h4 className="section-title">Scope of work</h4>
          <p style={{ fontSize: "0.9375rem" }}>{tender.project_details}</p>

          {tender.requirements && (
            <>
              <h4 className="section-title">Contractor requirements</h4>
              <p style={{ fontSize: "0.9375rem" }}>{tender.requirements}</p>
            </>
          )}

          {tender.archaeologist && (
            <>
              <h4 className="section-title">Lead archaeologist</h4>
              <p style={{ fontSize: "0.9375rem", margin: 0 }}>
                {tender.archaeologist.name} ({tender.archaeologist.nid}) —{" "}
                {tender.archaeologist.email}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="panel">
        <div className="panel-head">
          <h3>
            <MapPin size={15} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: "0.35rem" }} />
            Site location
          </h3>
        </div>
        <div className="panel-body">
          {tender.location?.lat != null ? (
            <>
              <GoogleMapPicker value={tender.location} editable={false} height={250} />
              <p className="hint" style={{ margin: "0.6rem 0 0" }}>
                {tender.location.address || `${tender.location.lat}, ${tender.location.lng}`}
              </p>
            </>
          ) : (
            <p className="hint" style={{ margin: 0 }}>
              No coordinates are recorded for this tender.
            </p>
          )}
        </div>
      </div>

      {/* Bids */}
      <div className="panel">
        <div className="panel-head">
          <h3>Submitted bids ({bids.length})</h3>
        </div>
        <div className="panel-body">
        {bids.length === 0 ? (
          <p className="hint" style={{ margin: 0 }}>
            No contractor has bid on this tender yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {bids.map((b) => {
              const isLowest = b.status !== "Withdrawn" && b.cost === lowest;
              const isFastest = b.status !== "Withdrawn" && b.timeline_days === fastest;
              return (
                <div
                  key={b._id}
                  className="card"
                  style={{
                    margin: 0,
                    borderLeft: `3px solid ${
                      b.status === "Accepted"
                        ? "var(--success)"
                        : b.status === "Rejected"
                        ? "var(--danger)"
                        : b.status === "Withdrawn"
                        ? "var(--border-strong)"
                        : "var(--accent)"
                    }`,
                  }}
                >
                  <div className="report-header">
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ margin: "0 0 0.25rem" }}>{b.company_name}</h4>
                      <StarRating
                        value={ratings[b.team?._id]?.average ?? null}
                        readOnly
                        count={ratings[b.team?._id]?.count}
                        size={14}
                      />
                      <p className="record-meta" style={{ marginTop: "0.3rem" }}>
                        {b.team?.representative}
                        {b.team?.representative_designation
                          ? ` (${b.team.representative_designation})`
                          : ""}{" "}
                        · {b.team?.email}
                      </p>
                    </div>
                    <div className="record-side">
                      {isLowest && <span className="chip">Lowest price</span>}
                      {isFastest && <span className="chip">Shortest programme</span>}
                      <StatusBadge status={b.status} />
                    </div>
                  </div>

                  <dl className="detail-list" style={{ margin: "1.1rem 0" }}>
                    <div>
                      <dt>
                        <Banknote size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Bid price
                      </dt>
                      <dd className="num">৳{b.cost?.toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt>
                        <Clock size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Programme
                      </dt>
                      <dd className="num">{b.timeline_days} days</dd>
                    </div>
                    <div>
                      <dt>Lodged</dt>
                      <dd className="num">{new Date(b.submitted_at).toLocaleDateString()}</dd>
                    </div>
                    {b.team?.team_size != null && (
                      <div>
                        <dt>Field crew</dt>
                        <dd className="num">{b.team.team_size}</dd>
                      </div>
                    )}
                  </dl>

                  <p style={{ fontSize: "0.9375rem" }}>{b.proposal}</p>

                  {isOpen && b.status === "Pending" && (
                    <div
                      className="actions"
                      style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}
                    >
                      <button
                        className="btn-small btn-approve"
                        onClick={() => awardBid(b)}
                        disabled={busyId === b._id}
                      >
                        <Trophy size={13} aria-hidden="true" /> Award the contract
                      </button>
                      <button
                        className="btn-small btn-deny"
                        onClick={() => rejectBid(b)}
                        disabled={busyId === b._id}
                      >
                        <XCircle size={13} aria-hidden="true" /> Reject bid
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>

      {isOpen && (
        <div className="panel">
          <div className="panel-head">
            <h3>Withdraw this tender</h3>
          </div>
          <div className="panel-body">
            {showCancel ? (
              <div className="form">
                <label>
                  Reason for withdrawal
                  <textarea
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="This reason is shown to every contractor that bid"
                  />
                </label>
                <div className="actions">
                  <button className="btn btn-deny" onClick={cancelTender}>
                    Confirm withdrawal
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowCancel(false)}>
                    Keep tender open
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="hint" style={{ marginTop: 0 }}>
                  Withdrawing closes the tender and rejects every outstanding bid. This cannot be
                  undone.
                </p>
                <button className="btn-small btn-deny" onClick={() => setShowCancel(true)}>
                  <Ban size={13} aria-hidden="true" /> Withdraw tender
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
