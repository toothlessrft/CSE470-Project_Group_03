import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";

export default function ManageProjects() {
  const [ongoing, setOngoing] = useState([]);
  const [past, setPast] = useState([]);

  function load() {
    api.get("/arc/projects").then((data) => {
      setOngoing(data.ongoing_projects);
      setPast(data.past_projects);
    });
  }

  useEffect(load, []);

  async function endProject(id) {
    await api.post(`/arc/projects/${id}/end`);
    load();
  }

  return (
    <div className="page">
      <h1>Manage Projects</h1>

      <h2>Ongoing</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Site</th>
            <th>Organization</th>
            <th>Progress</th>
            <th>Budget</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {ongoing.map((p) => (
            <tr key={p._id}>
              <td>{p.p_name}</td>
              <td>{p.site?.name}</td>
              <td>{p.organization}</td>
              <td>{p.progress}</td>
              <td>{p.budget}</td>
              <td className="actions">
                <Link to={`/arc/projects/${p._id}/team`}>Team</Link>
                <Link to={`/arc/projects/${p._id}/site`}>Edit Site</Link>
                <Link to={`/arc/projects/${p._id}/items`}>Add Item</Link>
                <Link to={`/arc/projects/${p._id}/tools`}>Request Tool</Link>
                <button className="btn-link" onClick={() => endProject(p._id)}>
                  End Project
                </button>
              </td>
            </tr>
          ))}
          {ongoing.length === 0 && (
            <tr>
              <td colSpan={6}>No ongoing projects.</td>
            </tr>
          )}
        </tbody>
      </table>

      <h2>Past</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Site</th>
            <th>Start</th>
            <th>End</th>
            <th>Budget</th>
          </tr>
        </thead>
        <tbody>
          {past.map((p) => (
            <tr key={p._id}>
              <td>{p.p_name}</td>
              <td>{p.site?.name}</td>
              <td>{p.start_date?.slice(0, 10)}</td>
              <td>{p.end_date?.slice(0, 10)}</td>
              <td>{p.budget}</td>
            </tr>
          ))}
          {past.length === 0 && (
            <tr>
              <td colSpan={5}>No past projects.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
