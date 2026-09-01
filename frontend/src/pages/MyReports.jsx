import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { MapPin, FileSearch, Plus, UserCheck, CheckCircle2, XCircle } from "lucide-react";
import { api } from "../api";
import StatusBadge from "../components/StatusBadge";

export default function MyReports() {
  const location = useLocation();
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/reports/mine")
      .then((data) => setReports(data.reports))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Discovery reports</span>
          <h1>My submissions</h1>
          <p className="page-subtitle">
            Every find you have reported, and where it has reached in the inspection process.
          </p>
        </div>
        <Link className="btn" to="/report-discovery">
          <Plus size={16} aria-hidden="true" /> Report a find
        </Link>
      </div>

      {location.state?.justSubmitted && (
        <div className="alert alert-success">
          Report submitted. It is now queued for review by the heritage authority.
        </div>
      )}
      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading your submissions
        </div>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <FileSearch size={26} aria-hidden="true" />
          <h3>No submissions yet</h3>
          <p>
            When you report a find, it will appear here with its inspection status and the
            archaeologist assigned to it.
          </p>
          <Link className="btn" to="/report-discovery">
            Report a find
          </Link>
        </div>
      ) : (
        reports.map((r) => (
          <div className="card" key={r._id}>
            <div className="report-header">
              <h3 style={{ margin: 0 }}>{r.material}</h3>
              <StatusBadge status={r.status} />
            </div>

            <p className="meta-row">
              <span>
                <MapPin size={13} aria-hidden="true" />
                {r.location?.address ||
                  `${r.location.lat.toFixed(5)}, ${r.location.lng.toFixed(5)}`}
              </span>
              <span>Submitted {new Date(r.createdAt).toLocaleDateString()}</span>
            </p>

            {r.notes && <p style={{ marginTop: "0.75rem" }}>{r.notes}</p>}

            {r.images?.length > 0 && (
              <div className="image-grid">
                {r.images.map((src, i) => (
                  <div className="image-thumb" key={i}>
                    <img src={src} alt={`Photograph ${i + 1} of the reported find`} />
                  </div>
                ))}
              </div>
            )}

            {r.status === "Assigned" && r.assignment?.researcher && (
              <div className="alert alert-info" style={{ marginTop: "1rem", marginBottom: 0 }}>
                <UserCheck size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  Assigned to <strong>{r.assignment.researcher.name}</strong> for field inspection
                  {r.assignment.due_date &&
                    `, due ${new Date(r.assignment.due_date).toLocaleDateString()}`}
                  .
                </span>
              </div>
            )}
            {r.status === "Verified" && (
              <div className="alert alert-success" style={{ marginTop: "1rem", marginBottom: 0 }}>
                <CheckCircle2 size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>Verified as a genuine find following field inspection.</span>
              </div>
            )}
            {r.status === "Rejected" && (
              <div className="alert alert-danger" style={{ marginTop: "1rem", marginBottom: 0 }}>
                <XCircle size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>The field inspection could not verify this report.</span>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
