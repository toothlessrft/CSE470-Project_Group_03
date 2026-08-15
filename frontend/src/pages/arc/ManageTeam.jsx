import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Users, Mail, Phone, Banknote, CalendarClock, BadgeCheck, ArrowLeft } from "lucide-react";
import { api } from "../../api";

export default function ManageTeam() {
  const { projectId } = useParams();
  const [pName, setPName] = useState("");
  const [teams, setTeams] = useState([]);
  const [excavationTeam, setExcavationTeam] = useState(null); // Ahad_23201016
  const [budget, setBudget] = useState(null);
  const [timeline, setTimeline] = useState(null);
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
      setExcavationTeam(data.excavation_team || null); // Ahad_23201016
      setBudget(data.budget ?? null);
      setTimeline(data.agreed_timeline_days ?? null);
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
      <p>
        <Link to="/arc/projects" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
          <ArrowLeft size={14} /> Back to Manage Projects
        </Link>
      </p>

      <h1>Excavation Team</h1>
      <p className="page-subtitle">{pName}</p>

      {/* Ahad_23201016 - the company awarded this dig through the tender process */}
      {excavationTeam ? (
        <div className="card" style={{ borderLeft: "4px solid var(--success)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <BadgeCheck size={18} style={{ color: "var(--success)" }} />
            <h3 style={{ margin: 0 }}>{excavationTeam.company_name}</h3>
          </div>

          <p className="hint" style={{ marginTop: 0 }}>
            Awarded this excavation through the Government tender process.
          </p>

          <table className="table" style={{ marginBottom: 0 }}>
            <tbody>
              <tr>
                <th style={{ width: "220px" }}>Company Representative</th>
                <td>
                  {excavationTeam.representative}
                  {excavationTeam.representative_designation
                    ? ` \u2014 ${excavationTeam.representative_designation}`
                    : ""}
                </td>
              </tr>
              <tr>
                <th>Registration ID</th>
                <td>{excavationTeam.nid}</td>
              </tr>
              <tr>
                <th>Contact</th>
                <td style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                    <Mail size={13} /> {excavationTeam.email}
                  </span>
                  {excavationTeam.phone && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                      <Phone size={13} /> {excavationTeam.phone}
                    </span>
                  )}
                </td>
              </tr>
              {excavationTeam.team_size != null && (
                <tr>
                  <th>Crew Size</th>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                      <Users size={13} /> {excavationTeam.team_size} people
                    </span>
                  </td>
                </tr>
              )}
              {budget != null && (
                <tr>
                  <th>Awarded Contract Value</th>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                      <Banknote size={13} /> &#2547;{budget.toLocaleString()}
                    </span>
                  </td>
                </tr>
              )}
              {timeline != null && (
                <tr>
                  <th>Agreed Timeline</th>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                      <CalendarClock size={13} /> {timeline} days
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="alert alert-info">
            No excavation team has been awarded this project through a tender. You can still manage
            internal working teams below.
          </div>

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
        </>
      )}
    </div>
  );
}
