import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api";

export default function ManageTeam() {
  const { projectId } = useParams();
  const [pName, setPName] = useState("");
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState("");

  const [role, setRole] = useState("");
  const [managerNid, setManagerNid] = useState("");
  const [memberList, setMemberList] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  function load() {
    api.get(`/arc/projects/${projectId}/team`).then((data) => {
      setPName(data.p_name);
      setTeams(data.teams);
    });
  }

  useEffect(load, [projectId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post(`/arc/projects/${projectId}/team`, {
        role,
        manager_nid: managerNid,
        member_list: memberList,
        name,
        email,
        phone,
      });
      setRole("");
      setManagerNid("");
      setMemberList("");
      setName("");
      setEmail("");
      setPhone("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function disband(teamNo) {
    await api.del(`/arc/projects/${projectId}/team/${teamNo}`);
    load();
  }

  return (
    <div className="page">
      <h1>Manage Team - {pName}</h1>

      <table className="table">
        <thead>
          <tr>
            <th>Team #</th>
            <th>Role</th>
            <th>Manager</th>
            <th>Members</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t) => (
            <tr key={t._id}>
              <td>{t.teamNo}</td>
              <td>{t.role}</td>
              <td>{t.manager?.name} ({t.manager?.nid})</td>
              <td>{t.member_list}</td>
              <td>
                <button className="btn-link" onClick={() => disband(t.teamNo)}>
                  Disband
                </button>
              </td>
            </tr>
          ))}
          {teams.length === 0 && (
            <tr>
              <td colSpan={5}>No teams yet.</td>
            </tr>
          )}
        </tbody>
      </table>

      <h2>Add a team</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit} className="form">
        <label>
          Role (what the team works on)
          <input value={role} onChange={(e) => setRole(e.target.value)} required />
        </label>
        <label>
          Manager NID
          <input value={managerNid} onChange={(e) => setManagerNid(e.target.value)} required />
        </label>
        <label>
          Member list (comma separated)
          <input value={memberList} onChange={(e) => setMemberList(e.target.value)} />
        </label>
        <fieldset>
          <legend>Only needed if the manager NID is new</legend>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
        </fieldset>
        <button type="submit" className="btn">
          Create Team
        </button>
      </form>
    </div>
  );
}
