import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useAuth, ROLE_HOME } from "../context/AuthContext";
import SearchableSelect from "../components/SearchableSelect";
import { MUSEUMS } from "../data/museums";
//import { api } from "../api";

const ROLES = [
  { value: "public", label: "Member of the public" },
  { value: "archaeologist", label: "Archaeologist / researcher" },
  { value: "excavation_team", label: "Excavation contractor" }, // Ahad_23201016
  { value: "museum_manager", label: "Museum authority" },
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

// Excavation Team - Ahad_23201016
// The account represents a company; `name` above is its representative.
const [companyName, setCompanyName] = useState("");
const [repDesignation, setRepDesignation] = useState("");
const [teamSize, setTeamSize] = useState("");

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
    };
  }

  // Ahad_23201016
  if (role === "excavation_team") {
    return {
      company_name: companyName,
      representative_designation: repDesignation,
      team_size: teamSize,
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
        <h1>Register for access</h1>
        <p className="page-subtitle">
          Accounts other than public membership are reviewed by the heritage authority before they
          are activated.
        </p>

        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit} className="form">
        <label>
          National ID number
          <input value={nid} onChange={(e) => setNid(e.target.value)} required />
        </label>
        <label>
          {/* Ahad_23201016 - for an excavation team this is the company representative */}
          {role === "excavation_team" ? "Company representative (full name)" : "Full name"}
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Email address
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label>
          Phone number
          <input value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        <label>
          Register as
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
            <legend>Researcher details</legend>
            <label>
              Institution or university
              <input value={affiliation} onChange={(e) => setAffiliation(e.target.value)} placeholder="e.g. Department of Archaeology, University of Dhaka" />
            </label>
            <label>
              Specialization
              <textarea value={specialization} onChange={(e) => setSpecialization(e.target.value)}/>
            </label>
          </fieldset>
        )}

        {role === "museum_manager" && (
          <fieldset>
            <legend>Museum details</legend>
            <label>
              Museum you represent
              <SearchableSelect
                options={MUSEUMS}
                value={museumName}
                onChange={setMuseumName}
                placeholder="Start typing to find your museum"
                required
              />
            </label>
          </fieldset>
        )}

        {/* Ahad_23201016 - Excavation Team registers as a company */}
        {role === "excavation_team" && (
          <fieldset>
            <legend>Contractor details</legend>
            <label>
              Registered company name
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Bengal Excavation Works Ltd."
                required
              />
            </label>
            <label>
              Representative designation
              <input
                value={repDesignation}
                onChange={(e) => setRepDesignation(e.target.value)}
                placeholder="e.g. Site Operations Manager"
              />
            </label>
            <label>
              Field crew size
              <input
                type="number"
                min="1"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                placeholder="e.g. 18"
              />
            </label>
            <p className="hint" style={{ margin: 0 }}>
              The full name entered above is recorded as your company representative.
            </p>
          </fieldset>
        )}

        <button type="submit" className="btn">
          Submit registration
        </button>
      </form>
      <p className="auth-footer">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
      </div>
    </div>
  );
}
