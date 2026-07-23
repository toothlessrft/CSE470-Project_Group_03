import { useEffect, useState } from "react";
import { api } from "../../api";

export default function ViewApprovedRequests() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/admin/approved-requests").then(setData);
  }, []);

  if (!data) return <div className="page">Loading...</div>;

  return (
    <div className="page">
      <h1>Approved Requests</h1>

      <h2>Item Requests</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Manager</th>
            <th>Item</th>
            <th>Purpose</th>
            <th>Approved by</th>
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
        </tbody>
      </table>

      <h2>Maintenance Requests</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Site</th>
            <th>Caretaker</th>
            <th>Approved Budget</th>
            <th>Approved by</th>
          </tr>
        </thead>
        <tbody>
          {data.approved_maintenance_requests.map((r) => (
            <tr key={r._id}>
              <td>{r.site?.name}</td>
              <td>{r.caretaker?.name}</td>
              <td>{r.approved_budget}</td>
              <td>{r.admin?.name}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Tool Requests</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Requester</th>
            <th>Tool</th>
            <th>Approved by</th>
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
        </tbody>
      </table>
    </div>
  );
}
