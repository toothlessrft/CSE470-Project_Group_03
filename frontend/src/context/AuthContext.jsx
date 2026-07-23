import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(identifier, password) {
    const data = await api.post("/auth/login", { identifier, password });
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
  const data = await api.post("/auth/register", payload);

  // General Public is logged in immediately
  if (data.user) {
    setUser(data.user);
    return {
      user: data.user,
      pending: false,
    };
  }

  // Other roles are waiting for admin approval
  return {
    user: null,
    pending: true,
    message: data.message,
  };
}

  async function logout() {
    await api.post("/auth/logout");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Maps role -> the dashboard route it should land on after login,
// mirroring the if/elif chain at the end of app.py's login() view.
export const ROLE_HOME = {
  public: "/public/dashboard",
  archaeologist: "/arc/dashboard",
  admin: "/admin/dashboard",
  museum_manager: "/mm/dashboard",
  site_caretaker: "/sc/dashboard",
};
