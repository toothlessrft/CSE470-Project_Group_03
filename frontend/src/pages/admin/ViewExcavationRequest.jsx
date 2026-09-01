import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "../../api";

export default function ViewExcavationRequest() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/admin/excavation-requests/${id}`).then((data) => setRequest(data.request_data));
  }, [id]);

  async function decide(action) {
    setError("");
    try {
      await api.post(`/admin/excavation-requests/${id}`, { action });
      navigate("/admin/excavation-requests");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!request)
    return (
      <div className="page">
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading the proposal
        </div>
      </div>
    );

  return (
    <div className="page narrow">
      <Link className="back-link" to="/admin/excavation-requests">
        <ArrowLeft size={14} aria-hidden="true" /> Back to proposals
      </Link>

      <div className="page-head">
        <div>
          <span className="eyebrow">Excavation proposal</span>
          <h1>{request.site?.name || "Proposed site"}</h1>
          <p className="page-subtitle">
            Submitted by {request.archaeologist?.name}. Approving the proposal opens a licensed
            excavation project.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="panel">
        <div className="panel-head">
          <h3>Proposal details</h3>
        </div>
        <div className="panel-body">
          <dl className="detail-list" style={{ marginBottom: "1.25rem" }}>
            <div>
              <dt>Applicant</dt>
              <dd>{request.archaeologist?.name}</dd>
            </div>
            <div>
              <dt>Site</dt>
              <dd>{request.site?.name || "New site"}</dd>
            </div>
            <div>
              <dt>Period</dt>
              <dd>{request.site?.era || "Not stated"}</dd>
            </div>
            <div>
              <dt>Budget requested</dt>
              <dd className="num">৳{Number(request.budget || 0).toLocaleString()}</dd>
            </div>
          </dl>

          {request.site?.description && (
            <>
              <h4 className="section-title">Site description</h4>
              <p style={{ fontSize: "0.9375rem" }}>{request.site.description}</p>
            </>
          )}
          {request.site?.architecture && (
            <>
              <h4 className="section-title">Structural evidence</h4>
              <p style={{ fontSize: "0.9375rem" }}>{request.site.architecture}</p>
            </>
          )}
          <h4 className="section-title">Research proposal</h4>
          <p style={{ fontSize: "0.9375rem", marginBottom: 0 }}>{request.proposal}</p>
        </div>
      </div>

      <div className="actions">
        <button className="btn btn-approve" onClick={() => decide("approve")}>
          Approve and open project
        </button>
        <button className="btn btn-deny" onClick={() => decide("deny")}>
          Decline proposal
        </button>
      </div>
    </div>
  );
}
