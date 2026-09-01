import { useEffect, useState } from "react";
import { UserCheck } from "lucide-react";
import { api } from "../../api";

const ROLE_LABELS = {
  archaeologist: "Archaeologist",
  museum_manager: "Museum authority",
  excavation_team: "Excavation contractor",
  public: "Public member",
};

export default function PendingUsers() {
  const [users, setUsers] = useState([]);

  async function loadUsers() {
    const data = await api.get("/admin/pending-users");
    setUsers(data.users);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function approve(id) {
    await api.patch(`/admin/users/${id}/approve`);
    loadUsers();
  }

  async function reject(id) {
    await api.patch(`/admin/users/${id}/reject`);
    loadUsers();
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Access control</span>
          <h1>Account approvals</h1>
          <p className="page-subtitle">
            Professional registrations awaiting verification. Admitting an account grants it the
            permissions of its role.
          </p>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Requested role</th>
              <th>Email address</th>
              <th>Decision</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{ROLE_LABELS[u.role] || u.role}</td>
                <td>{u.email}</td>
                <td className="actions">
                  <button className="btn-small btn-approve" onClick={() => approve(u._id)}>
                    Admit
                  </button>
                  <button className="btn-small btn-deny" onClick={() => reject(u._id)}>
                    Decline
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="hint">
                  No registrations awaiting a decision.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}