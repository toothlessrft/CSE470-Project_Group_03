import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
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
      <h1>My Discovery Reports</h1>

      {location.state?.justSubmitted && (
        <div className="alert alert-success">
          Thanks! Your report was submitted and is awaiting review.
        </div>
      )}
      {error && <div className="alert alert-danger">{error}</div>}

      <p className="hint">
        Track the status of artifacts you've reported. <Link to="/report-discovery">Report another discovery →</Link>
      </p>

      {loading ? (
        <p>Loading...</p>
      ) : reports.length === 0 ? (
        <div className="card">
          You haven't reported any discoveries yet. <Link to="/report-discovery">Report one now</Link>.
        </div>
      ) : (
        reports.map((r) => (
          <div className="card" key={r._id}>
            <div className="report-header">
              <strong>{r.material}</strong>
              <StatusBadge status={r.status} />
            </div>
            <p className="hint">
              📍 {r.location?.address || `${r.location.lat.toFixed(5)}, ${r.location.lng.toFixed(5)}`}
            </p>
            {r.notes && <p>{r.notes}</p>}
            {r.images?.length > 0 && (
              <div className="image-grid">
                {r.images.map((src, i) => (
                  <div className="image-thumb" key={i}>
                    <img src={src} alt={`report-${i}`} />
                  </div>
                ))}
              </div>
            )}

            {r.status === "Assigned" && r.assignment?.researcher && (
              <div className="alert alert-success">
                Assigned to <strong>{r.assignment.researcher.name}</strong> for field inspection
                {r.assignment.due_date &&
                  ` — report due ${new Date(r.assignment.due_date).toLocaleDateString()}`}
                .
              </div>
            )}
            {r.status === "Verified" && (
              <div className="alert alert-success">✅ Verified as a genuine find.</div>
            )}
            {r.status === "Rejected" && (
              <div className="alert alert-danger">
                This report could not be verified by the field inspection.
              </div>
            )}

            <p className="hint">Submitted {new Date(r.createdAt).toLocaleString()}</p>
          </div>
        ))
      )}
    </div>
  );
}
