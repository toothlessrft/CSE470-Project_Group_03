import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useAuth, ROLE_HOME } from "../context/AuthContext";
import { api } from "../api";

const ROLES = [
  { value: "archaeologist", label: "Archaeologist" },
  { value: "museum_manager", label: "Museum Manager" },
  { value: "site_caretaker", label: "Site Caretaker" },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [nid, setNid] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("archaeologist");
  const [error, setError] = useState("");

  // archaeologist
  const [affiliation, setAffiliation] = useState("");
  const [biography, setBiography] = useState("");
  // museum_manager
  const [museumName, setMuseumName] = useState("");
  const [mCity, setMCity] = useState("");
  const [mStreet, setMStreet] = useState("");
  // site_caretaker
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState("");
  const [budget, setBudget] = useState("");

  useEffect(() => {
    if (role === "site_caretaker") {
      api.get("/auth/sites").then((data) => setSites(data.sites));
    }
  }, [role]);

  function buildRoleProfile() {
    if (role === "archaeologist") return { affiliation, biography };
    if (role === "museum_manager") return { museum_name: museumName, m_city: mCity, m_street: mStreet };
    if (role === "site_caretaker") return { site: siteId, budget: budget ? Number(budget) : undefined };
    return {};
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const user = await register({
        nid,
        name,
        email,
        phone,
        password,
        role,
        roleProfile: buildRoleProfile(),
      });
      navigate(ROLE_HOME[user.role] || "/");
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
        <p className="page-subtitle">Join as an archaeologist, museum manager, or site caretaker.</p>

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
            <legend>Archaeologist details</legend>
            <label>
              Affiliation
              <input value={affiliation} onChange={(e) => setAffiliation(e.target.value)} />
            </label>
            <label>
              Biography
              <textarea value={biography} onChange={(e) => setBiography(e.target.value)} />
            </label>
          </fieldset>
        )}

        {role === "museum_manager" && (
          <fieldset>
            <legend>Museum manager details</legend>
            <label>
              Museum name
              <input value={museumName} onChange={(e) => setMuseumName(e.target.value)} />
            </label>
            <label>
              City
              <input value={mCity} onChange={(e) => setMCity(e.target.value)} />
            </label>
            <label>
              Street
              <input value={mStreet} onChange={(e) => setMStreet(e.target.value)} />
            </label>
          </fieldset>
        )}

        {role === "site_caretaker" && (
          <fieldset>
            <legend>Site caretaker details</legend>
            <label>
              Assigned site
              <select value={siteId} onChange={(e) => setSiteId(e.target.value)} required>
                <option value="">-- choose a site --</option>
                {sites.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Budget
              <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
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
