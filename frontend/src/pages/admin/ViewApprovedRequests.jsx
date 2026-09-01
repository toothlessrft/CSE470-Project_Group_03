import { useEffect, useState } from "react";
import { api } from "../../api";

export default function ViewApprovedRequests() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/admin/approved-requests").then(setData);
  }, []);

  if (!data)
    return (
      <div className="page">
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading the decision record
        </div>
      </div>
    );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Audit trail</span>
          <h1>Decision record</h1>
          <p className="page-subtitle">
            Every request already approved, and the officer who authorised it.
          </p>
        </div>
      </div>

      <div className="section-head">
        <h2>Artifact requests</h2>
        <span className="hint">{data.approved_item_requests.length} approved</span>
      </div>
      <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Museum</th>
            <th>Artifact</th>
            <th>Purpose</th>
            <th>Authorised by</th>
          </tr>
        </thead>
        <tbody>
          {data.approved_item_requests.map((r) => (
            <tr key={r._id}>
              <td>{r.museum_manager?.name}</td>
              <td>{r.item?.name}</td>
              <td>{r.purpose}</td>
              <td>{r.admin?.name}</td>
            </tr>
          ))}
          {data.approved_item_requests.length === 0 && (
            <tr>
              <td colSpan={4} className="hint">
                No artifact requests approved yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

      <div className="section-head">
        <h2>Equipment requests</h2>
        <span className="hint">{data.approved_tool_requests.length} approved</span>
      </div>
      <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Requested by</th>
            <th>Equipment</th>
            <th>Authorised by</th>
          </tr>
        </thead>
        <tbody>
          {data.approved_tool_requests.map((r) => (
            <tr key={r._id}>
              <td>{r.user?.name}</td>
              <td>{r.tool?.type}</td>
              <td>{r.admin?.name}</td>
            </tr>
          ))}
          {data.approved_tool_requests.length === 0 && (
            <tr>
              <td colSpan={3} className="hint">
                No equipment requests approved yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
