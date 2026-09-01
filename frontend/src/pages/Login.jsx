import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth, ROLE_HOME } from "../context/AuthContext";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const user = await login(identifier, password);
      navigate(ROLE_HOME[user.role] || "/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-icon">
          <LogIn size={22} strokeWidth={2} />
        </div>
        <h1>Sign in</h1>
        <p className="page-subtitle">Access your workspace on the national heritage register.</p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <label>
            Email address or NID
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" className="btn">Sign in</button>
        </form>

        <p className="auth-footer">
          No account yet? <Link to="/register">Register for access</Link>
        </p>
      </div>
    </div>
  );
}