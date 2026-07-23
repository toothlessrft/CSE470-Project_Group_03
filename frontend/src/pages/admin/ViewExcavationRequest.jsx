import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

  if (!request) return <div className="page">Loading...</div>;

  return (
    <div className="page narrow">
      <h1>Excavation Request</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="card">
        <p>
          <strong>Archaeologist:</strong> {request.archaeologist?.name}
        </p>
        <p>
          <strong>Site:</strong> {request.site?.name} ({request.site?.era})
        </p>
        <p>
          <strong>Description:</strong> {request.site?.description}
        </p>
        <p>
          <strong>Architecture:</strong> {request.site?.architecture}
        </p>
        <p>
          <strong>Proposal:</strong> {request.proposal}
        </p>
        <p>
          <strong>Budget:</strong> {request.budget}
        </p>
      </div>
      <div className="actions">
        <button className="btn-small btn-approve" onClick={() => decide("approve")}>
          Approve (creates project)
        </button>
        <button className="btn-small btn-deny" onClick={() => decide("deny")}>
          Deny
        </button>
      </div>
    </div>
  );
}
