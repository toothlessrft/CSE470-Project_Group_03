import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import StatusBadge from "../../components/StatusBadge";

const TABS = ["All", "Pending", "Assigned", "Verified", "Rejected"];

export default function FieldReports() {
  const [tab, setTab] = useState("Pending");
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const query = tab === "All" ? "" : `?status=${tab}`;
    api
      .get(`/admin/reports${query}`)
      .then((data) => setReports(data.reports))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="page">
      <h1>Artifact Discovery Reports</h1>
      <p className="hint">Review reports submitted by the public and assign field inspections.</p>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={`tab ${tab === t ? "tab-active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : reports.length === 0 ? (
        <div className="card">No {tab !== "All" ? tab.toLowerCase() : ""} reports.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Material</th>
              <th>Location</th>
              <th>Reported by</th>
              <th>Status</th>
              <th>Submitted</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r._id}>
                <td>{r.material}</td>
                <td>{r.location?.address || `${r.location.lat.toFixed(4)}, ${r.location.lng.toFixed(4)}`}</td>
                <td>
                  {r.reporter?.name}
                  <br />
                  <span className="hint">{r.reporter?.email}</span>
                </td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td>
                  <Link className="btn-small" to={`/admin/reports/${r._id}`}>
                    {r.status === "Pending" ? "Assign" : "View"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
