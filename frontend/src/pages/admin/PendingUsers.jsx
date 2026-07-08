import { useEffect, useState } from "react";
import { api } from "../../api";

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
      <h1>Pending User Approvals</h1>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Email</th>
            <th>Approve</th>
            <th>Reject</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.role}</td>
              <td>{u.email}</td>

              <td>
                <button
                  className="btn"
                  onClick={() => approve(u._id)}
                >
                  Approve
                </button>
              </td>

              <td>
                <button
                  className="btn btn-danger"
                  onClick={() => reject(u._id)}
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}