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
      <Link className="back-link" to="/arc/projects">
        <ArrowLeft size={14} aria-hidden="true" /> Back to project register
      </Link>

      <div className="page-head">
        <div>
          <span className="eyebrow">{pName}</span>
          <h1>Field team</h1>
          <p className="page-subtitle">
            The contractor awarded this excavation, and any internal working teams assigned to it.
          </p>
        </div>
      </div>

      {/* Ahad_23201016 - the company awarded this dig through the tender process */}
      {excavationTeam ? (
        <div className="card" style={{ borderLeft: "3px solid var(--success)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
            <BadgeCheck size={17} style={{ color: "var(--success)" }} aria-hidden="true" />
            <h3 style={{ margin: 0 }}>{excavationTeam.company_name}</h3>
          </div>

          <p className="hint" style={{ marginTop: 0 }}>
            Awarded this excavation through the government tender process.
          </p>

          <table className="table" style={{ marginBottom: 0 }}>
            <tbody>
              <tr>
                <th style={{ width: "220px" }}>Representative</th>
                <td>
                  {excavationTeam.representative}
                  {excavationTeam.representative_designation
                    ? ` \u2014 ${excavationTeam.representative_designation}`
                    : ""}
                </td>
              </tr>
              <tr>
                <th>Registration number</th>
                <td>{excavationTeam.nid}</td>
              </tr>
              <tr>
                <th>Contact</th>
                <td style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                    <Mail size={13} aria-hidden="true" /> {excavationTeam.email}
                  </span>
                  {excavationTeam.phone && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                      <Phone size={13} aria-hidden="true" /> {excavationTeam.phone}
                    </span>
                  )}
                </td>
              </tr>
              {excavationTeam.team_size != null && (
                <tr>
                  <th>Field crew</th>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                      <Users size={13} aria-hidden="true" /> {excavationTeam.team_size} people
                    </span>
                  </td>
                </tr>
              )}
              {budget != null && (
                <tr>
                  <th>Contract value</th>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                      <Banknote size={13} aria-hidden="true" /> &#2547;{budget.toLocaleString()}
                    </span>
                  </td>
                </tr>
              )}
              {timeline != null && (
                <tr>
                  <th>Agreed duration</th>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                      <CalendarClock size={13} aria-hidden="true" /> {timeline} days
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
            No contractor has been awarded this project through a tender. Internal working teams can
            still be recorded below.
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Team</th>
                <th>Function</th>
                <th>Supervisor</th>
                <th>Members</th>
                <th>Action</th>
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
                    <button className="btn-small btn-secondary" onClick={() => disband(t.teamNo)}>
                      Disband
                    </button>
                  </td>
                </tr>
              ))}
              {teams.length === 0 && (
                <tr>
                  <td colSpan={5} className="hint">
                    No working teams recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <h2 className="section-title">Record a working team</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit} className="form">
            <label>
              Function
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Trench supervision, finds processing, surveying"
                required
              />
            </label>
            <label>
              Supervisor NID
              <input value={managerNid} onChange={(e) => setManagerNid(e.target.value)} required />
            </label>
            <label>
              Members (comma separated)
              <input
                value={memberList}
                onChange={(e) => setMemberList(e.target.value)}
                placeholder="e.g. R. Karim, S. Haque, T. Islam"
              />
            </label>
            <fieldset>
              <legend>Required only if the supervisor is not yet registered</legend>
              <label>
                Full name
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label>
                Email address
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label>
                Phone number
                <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
            </fieldset>
            <button type="submit" className="btn">
              Record team
            </button>
          </form>
        </>
      )}
    </div>
  );
}
