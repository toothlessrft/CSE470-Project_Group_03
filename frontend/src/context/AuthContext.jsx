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

  // General Public is logged in straight away
  if (data.user) {
    setUser(data.user);
    return {
      user: data.user,
      pending: false,
    };
  }

  // Every other role waits for admin approval
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

// Where each role lands after logging in.
export const ROLE_HOME = {
  public: "/public/dashboard",
  archaeologist: "/arc/dashboard",
  admin: "/admin/dashboard",
  museum_manager: "/mm/dashboard",
  excavation_team: "/et/dashboard", // Ahad_23201016
};
