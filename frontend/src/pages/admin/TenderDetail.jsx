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
      <p>
        <Link to="/admin/tenders" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
          <ArrowLeft size={14} /> Back to tenders
        </Link>
      </p>

      <div className="report-header">
        <h1 style={{ margin: 0 }}>{tender.title}</h1>
        <StatusBadge status={tender.status === "Open" ? "Active" : tender.status} />
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {isOpen && deadlinePassed && (
        <div className="alert alert-info">
          <Clock size={14} style={{ verticalAlign: "middle" }} /> The bidding deadline has passed. No
          new or revised bids can come in — evaluate the bids below and assign a team.
        </div>
      )}

      {tender.status === "Awarded" && tender.awarded_team && (
        <div className="alert alert-success">
          <Trophy size={15} style={{ verticalAlign: "middle" }} /> Awarded to{" "}
          <strong>{tender.awarded_team.company_name}</strong> (rep. {tender.awarded_team.representative}) on{" "}
          {new Date(tender.awarded_at).toLocaleDateString()}.{" "}
          {tender.project && (
            <Link to={`/admin/excavation-projects`}>
              View the active project <ArrowRight size={12} style={{ verticalAlign: "middle" }} />
            </Link>
          )}
        </div>
      )}

      {tender.status === "Cancelled" && (
        <div className="alert alert-danger">
          This tender was cancelled. {tender.cancel_reason}
        </div>
      )}

      {/* Tender details */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Tender Details</h3>
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            flexWrap: "wrap",
            marginBottom: "1rem",
            fontSize: "0.9rem",
            color: "var(--muted)",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <Banknote size={15} /> Estimated budget:{" "}
            <strong style={{ color: "var(--text)" }}>
              ৳{tender.estimated_budget?.toLocaleString()}
            </strong>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <CalendarClock size={15} /> Deadline:{" "}
            <strong style={{ color: "var(--text)" }}>
              {new Date(tender.deadline).toLocaleString()}
            </strong>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <Users size={15} /> {liveBids.length} active bid{liveBids.length === 1 ? "" : "s"}
          </span>
        </div>

        <h4>Project Details</h4>
        <p style={{ fontSize: "0.92rem" }}>{tender.project_details}</p>

        {tender.requirements && (
          <>
            <h4>Requirements</h4>
            <p style={{ fontSize: "0.92rem" }}>{tender.requirements}</p>
          </>
        )}

        {tender.archaeologist && (
          <>
            <h4>Lead Archaeologist</h4>
            <p style={{ fontSize: "0.9rem", margin: 0 }}>
              {tender.archaeologist.name} ({tender.archaeologist.nid}) — {tender.archaeologist.email}
            </p>
          </>
        )}
      </div>

      {/* Location */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>
          <MapPin size={16} style={{ verticalAlign: "middle" }} /> Excavation Location
        </h3>
        {tender.location?.lat != null ? (
          <>
            <GoogleMapPicker value={tender.location} editable={false} height={250} />
            <p className="hint" style={{ marginBottom: 0 }}>
              {tender.location.address || `${tender.location.lat}, ${tender.location.lng}`}
            </p>
          </>
        ) : (
          <p className="hint">No coordinates recorded for this tender.</p>
        )}
      </div>

      {/* Bids */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Submitted Bids ({bids.length})</h3>
        {bids.length === 0 ? (
          <p className="hint" style={{ margin: 0 }}>
            No excavation teams have bid on this tender yet.
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
                    padding: "1.1rem 1.25rem",
                    background: b.status === "Accepted" ? "#f5fbf6" : "var(--surface)",
                    borderLeft: `4px solid ${
                      b.status === "Accepted"
                        ? "var(--success)"
                        : b.status === "Rejected"
                        ? "var(--danger)"
                        : b.status === "Withdrawn"
                        ? "var(--border)"
                        : "var(--accent)"
                    }`,
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
                      <strong style={{ fontSize: "1rem" }}>{b.company_name}</strong>
                      <div style={{ margin: "0.3rem 0" }}>
                        <StarRating
                          value={ratings[b.team?._id]?.average ?? null}
                          readOnly
                          count={ratings[b.team?._id]?.count}
                          size={14}
                        />
                      </div>
                      <p className="hint" style={{ margin: "0.15rem 0 0" }}>
                        Rep. {b.team?.representative}
                        {b.team?.representative_designation
                          ? ` (${b.team.representative_designation})`
                          : ""}{" "}
                        · {b.team?.email}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                      {isLowest && (
                        <span
                          className="status-badge"
                          style={{ backgroundColor: "#2e7d32" }}
                          title="Lowest cost"
                        >
                          Lowest Cost
                        </span>
                      )}
                      {isFastest && (
                        <span
                          className="status-badge"
                          style={{ backgroundColor: "#2563eb" }}
                          title="Fastest timeline"
                        >
                          Fastest
                        </span>
                      )}
                      <StatusBadge status={b.status} />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "1.5rem",
                      flexWrap: "wrap",
                      margin: "0.85rem 0",
                      fontSize: "0.88rem",
                      color: "var(--muted)",
                    }}
                  >
                    <span>
                      <Banknote size={14} style={{ verticalAlign: "middle" }} /> Cost:{" "}
                      <strong style={{ color: "var(--text)" }}>৳{b.cost?.toLocaleString()}</strong>
                    </span>
                    <span>
                      <Clock size={14} style={{ verticalAlign: "middle" }} /> Timeline:{" "}
                      <strong style={{ color: "var(--text)" }}>{b.timeline_days} days</strong>
                    </span>
                    <span>Submitted {new Date(b.submitted_at).toLocaleDateString()}</span>
                    {b.team?.team_size != null && <span>{b.team.team_size} crew</span>}
                  </div>

                  <p style={{ fontSize: "0.9rem" }}>{b.proposal}</p>

                  {isOpen && b.status === "Pending" && (
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                        borderTop: "1px solid var(--border)",
                        paddingTop: "0.9rem",
                      }}
                    >
                      <button
                        className="btn-small btn-approve"
                        onClick={() => awardBid(b)}
                        disabled={busyId === b._id}
                      >
                        <Trophy size={13} /> Assign This Team
                      </button>
                      <button
                        className="btn-small btn-deny"
                        onClick={() => rejectBid(b)}
                        disabled={busyId === b._id}
                      >
                        <XCircle size={13} /> Reject Bid
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Cancel Tender</h3>
          {showCancel ? (
            <div className="form">
              <label>
                Reason
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Why is this tender being withdrawn?"
                />
              </label>
              <div className="actions">
                <button className="btn btn-deny" onClick={cancelTender}>
                  Confirm Cancellation
                </button>
                <button className="btn-small" onClick={() => setShowCancel(false)}>
                  Keep Tender Open
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="hint">
                Cancelling closes the tender and rejects every pending bid. This cannot be undone.
              </p>
              <button className="btn-small btn-deny" onClick={() => setShowCancel(true)}>
                <Ban size={13} /> Cancel This Tender
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
