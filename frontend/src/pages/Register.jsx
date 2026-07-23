import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useAuth, ROLE_HOME } from "../context/AuthContext";
//import { api } from "../api";

const ROLES = [
  { value: "public", label: "General Public" },
  { value: "archaeologist", label: "Archaeologist / Researcher" },
  { value: "site_caretaker", label: "Excavation Team" },
  { value: "museum_manager", label: "Museum Authority" },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [nid, setNid] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("public");
  const [error, setError] = useState("");

  // Archaeologist / Researcher
const [affiliation, setAffiliation] = useState("");
const [specialization, setSpecialization] = useState("");

// Museum Authority
const [museumName, setMuseumName] = useState("");
const [designation, setDesignation] = useState("");
const [officeAddress, setOfficeAddress] = useState("");

// Excavation Team
const [organization, setOrganization] = useState("");
const [teamLeader, setTeamLeader] = useState("");

  function buildRoleProfile() {
  if (role === "public") {
    return {};
  }

  if (role === "archaeologist") {
    return {
      affiliation,
      specialization,
    };
  }

  if (role === "museum_manager") {
    return {
      museum_name: museumName,
      designation,
      address: officeAddress,
    };
  }

  if (role === "site_caretaker") {
    return {
      organization,
      team_leader: teamLeader,
    };
  }

  return {};
}

  async function handleSubmit(e) {
  e.preventDefault();
  setError("");

  try {
    const result = await register({
      nid,
      name,
      email,
      phone,
      password,
      role,
      roleProfile: buildRoleProfile(),
    });

    // General Public
    if (!result.pending) {
      navigate(ROLE_HOME[result.user.role] || "/");
      return;
    }

    // Other roles
    alert(result.message);
    navigate("/login");

  } catch (err) {
    setError(err.message);
  }
}

  return(
    <div className="auth-wrap">
      <div className="auth-card auth-card-wide">
        <div className="auth-icon">
          <UserPlus size={22} strokeWidth={2} />
        </div>
        <h1>Create an account</h1>
        <p className="page-subtitle">Register as General Public, Archaeologist/Researcher, Excavation Team, or Museum Authority.</p>

        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit} className="form">
        <label>
          NID
          <input value={nid} onChange={(e) => setNid(e.target.value)} required />
        </label>
        <label>
          Full name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Phone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <label>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        {role === "archaeologist" && (
          <fieldset>
            <legend>Researcher Details</legend>
            <label>
              Institution / University
              <input value={affiliation} onChange={(e) => setAffiliation(e.target.value)} />
            </label>
            <label>
              Specialization
              <textarea value={specialization} onChange={(e) => setSpecialization(e.target.value)}/>
            </label>
          </fieldset>
        )}

        {role === "museum_manager" && (
          <fieldset>
            <legend>Museum Authority Details</legend>
            <label>
              Museum name
              <input value={museumName} onChange={(e) => setMuseumName(e.target.value)} />
            </label>
            <label>
              Designation
              <input
  value={designation}
  onChange={(e) => setDesignation(e.target.value)}
/>
            </label>
            <label>
              Office address
              <input
  value={officeAddress}
  onChange={(e) => setOfficeAddress(e.target.value)}
/>
            </label>
          </fieldset>
        )}

        {role === "site_caretaker" && (
          <fieldset>
            <legend>Excavation Team Details</legend>
            <label>
              Organization
              <input
  value={organization}
  onChange={(e) => setOrganization(e.target.value)}
  placeholder="Organization Name"
/>
            </label>
            <label>
  Team Leader
  <input
    value={teamLeader}
    onChange={(e) => setTeamLeader(e.target.value)}
    placeholder="Team Leader"
  />
</label>
          </fieldset>
        )}

        <button type="submit" className="btn">
          Create account
        </button>
      </form>
      <p className="hint">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
      </div>
    </div>
  );
}
