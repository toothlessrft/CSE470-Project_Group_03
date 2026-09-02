import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileSearch } from "lucide-react";
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
      <div className="page-head">
        <div>
          <span className="eyebrow">Public reporting</span>
          <h1>Field reports</h1>
          <p className="page-subtitle">
            Discoveries reported by the public. Assign an archaeologist to inspect and verify each
            one.
          </p>
        </div>
      </div>

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
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading reports
        </div>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <FileSearch size={24} aria-hidden="true" />
          <h3>No reports here</h3>
          <p>
            There are no {tab !== "All" ? tab.toLowerCase() : ""} discovery reports at the moment.
          </p>
        </div>
      ) : (
        <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Material</th>
              <th>Find location</th>
              <th>Reported by</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Action</th>
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
                  <Link
                    className={r.status === "Pending" ? "btn-small" : "btn-small btn-secondary"}
                    to={`/admin/reports/${r._id}`}
                  >
                    {r.status === "Pending" ? "Assign inspection" : "Open record"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
