// Request Excavation Tools & Field Equipment
//
// Shared by archaeologists and excavation teams. The backend only lets the
// lead archaeologist or the assigned team of an *active* project request
// equipment, so if this page shows no projects there is nothing to request for.
import { useEffect, useMemo, useState } from "react";
import { Wrench, PackageCheck, AlertTriangle, Undo2, X } from "lucide-react";
import { api } from "../../api";
import StatusBadge from "../../components/StatusBadge";

const EMPTY_FORM = {
  tool_id: "",
  project_id: "",
  quantity: 1,
  start_date: "",
  end_date: "",
  purpose: "",
};

export default function RequestEquipment() {
  const [tools, setTools] = useState([]);
  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);

  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function loadAll() {
    setLoading(true);
    Promise.all([
      api.get("/inventory/tools"),
      api.get("/inventory/my-projects"),
      api.get("/inventory/requests/mine"),
    ])
      .then(([toolData, projectData, requestData]) => {
        setTools(toolData.tools || []);
        setProjects(projectData.projects || []);
        setRequests(requestData.requests || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(loadAll, []);

  const categories = useMemo(
    () => [...new Set(tools.map((t) => t.category).filter(Boolean))].sort(),
    [tools]
  );

  const visibleTools = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tools.filter((t) => {
      if (category !== "all" && t.category !== category) return false;
      if (!q) return true;
      return (
        t.type.toLowerCase().includes(q) ||
        t.model_no.toLowerCase().includes(q) ||
        (t.owner || "").toLowerCase().includes(q)
      );
    });
  }, [tools, category, search]);

  const selectedTool = tools.find((t) => t._id === form.tool_id);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await api.post("/inventory/requests", {
        ...form,
        quantity: Number(form.quantity) || 1,
      });
      setMessage("Request submitted. The Government/Admin will review it shortly.");
      setForm(EMPTY_FORM);
      loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function withdraw(id) {
    setError("");
    try {
      await api.del(`/inventory/requests/${id}`);
      setMessage("Request withdrawn.");
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function markReturned(id) {
    setError("");
    try {
      await api.post(`/inventory/requests/${id}/return`, {});
      setMessage("Equipment marked as returned.");
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="page">Loading...</div>;

  return (
    <div className="page">
      <h1>Tools & Field Equipment</h1>
      <p className="page-subtitle">
        Request excavation tools and field equipment for the digs you are running, and track what is
        currently signed out to you.
      </p>

      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {projects.length === 0 && (
        <div className="alert alert-info">
          <AlertTriangle size={15} style={{ verticalAlign: "-2px", marginRight: "0.4rem" }} />
          You are not currently leading or assigned to an active excavation project, so there is nothing to
          request equipment for yet.
        </div>
      )}

      {/* ---- Request form ---- */}
      {projects.length > 0 && (
        <>
          <h2 className="section-title">New request</h2>
          <form className="form" onSubmit={handleSubmit}>
            <label>
              Project (active zone)
              <select
                value={form.project_id}
                onChange={(e) => update("project_id", e.target.value)}
                required
              >
                <option value="">-- choose a project --</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.p_name}
                    {p.site_name ? ` - ${p.site_name}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Equipment
              <select value={form.tool_id} onChange={(e) => update("tool_id", e.target.value)} required>
                <option value="">-- choose equipment --</option>
                {tools
                  .filter((t) => t.requestable)
                  .map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.type} ({t.model_no}) - {t.available_units} available
                    </option>
                  ))}
              </select>
            </label>

            {selectedTool && (
              <p className="hint">
                Owner: {selectedTool.owner}
                {selectedTool.hazard ? ` | Hazard: ${selectedTool.hazard}` : ""}
                {selectedTool.insurance_info ? ` | Insurance: ${selectedTool.insurance_info}` : ""}
              </p>
            )}

            <label>
              Units required
              <input
                type="number"
                min="1"
                max={selectedTool?.available_units || 1}
                value={form.quantity}
                onChange={(e) => update("quantity", e.target.value)}
                required
              />
            </label>

            <label>
              Collection date
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => update("start_date", e.target.value)}
                required
              />
            </label>

            <label>
              Return date
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => update("end_date", e.target.value)}
                required
              />
            </label>

            <label>
              Purpose
              <textarea
                value={form.purpose}
                onChange={(e) => update("purpose", e.target.value)}
                placeholder="What the equipment will be used for on site"
                required
              />
            </label>

            <button type="submit" className="btn" disabled={busy}>
              <Wrench size={15} /> {busy ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </>
      )}

      {/* ---- My requests ---- */}
      <h2 className="section-title" style={{ marginTop: "2.2rem" }}>
        My requests
      </h2>
      <table className="table">
        <thead>
          <tr>
            <th>Equipment</th>
            <th>Project</th>
            <th>Units</th>
            <th>Dates</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => {
            const overdue =
              r.approval_status === "Approved" && !r.returned_at && new Date(r.end_date) < new Date();
            return (
              <tr key={r._id}>
                <td>
                  {r.tool?.type || "-"}
                  <br />
                  <span className="hint">{r.tool?.model_no}</span>
                </td>
                <td>{r.project?.p_name || "-"}</td>
                <td>{r.quantity ?? 1}</td>
                <td>
                  {r.start_date?.slice(0, 10)} to {r.end_date?.slice(0, 10)}
                  {overdue && (
                    <>
                      <br />
                      <span className="inv-overdue">Overdue</span>
                    </>
                  )}
                </td>
                <td>
                  <StatusBadge status={r.returned_at ? "Returned" : r.approval_status} />
                </td>
                <td className="actions">
                  {r.approval_status === "Pending" && (
                    <button className="btn-small btn-deny" onClick={() => withdraw(r._id)}>
                      <X size={13} /> Withdraw
                    </button>
                  )}
                  {r.approval_status === "Approved" && !r.returned_at && (
                    <button className="btn-small btn-approve" onClick={() => markReturned(r._id)}>
                      <Undo2 size={13} /> Mark returned
                    </button>
                  )}
                  {r.returned_at && (
                    <span className="hint">
                      <PackageCheck size={13} style={{ verticalAlign: "-2px" }} /> Returned{" "}
                      {r.returned_at.slice(0, 10)}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
          {requests.length === 0 && (
            <tr>
              <td colSpan={6}>You haven't requested any equipment yet.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ---- Catalogue ---- */}
      <h2 className="section-title" style={{ marginTop: "2.2rem" }}>
        Equipment catalogue
      </h2>
      <div className="inv-toolbar">
        <input
          type="search"
          placeholder="Search by type, model, or owner"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px" }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="inv-grid">
        {visibleTools.map((t) => (
          <div className="inv-card" key={t._id}>
            <span className="inv-tag">{t.category || "Other"}</span>
            <h4>{t.type}</h4>
            <p className="inv-card-meta">
              {t.model_no} | {t.owner}
            </p>
            {t.hazard && <p className="inv-card-meta">Hazard: {t.hazard}</p>}
            <div className="inv-stock">
              <span>
                <strong>{t.available_units}</strong>
                available
              </span>
              <span className="inv-out">
                <strong>{t.assigned_units}</strong>
                on site
              </span>
              <span>
                <strong>{t.quantity_total}</strong>
                total
              </span>
            </div>
            {t.status !== "In Service" && <p className="inv-overdue">{t.status}</p>}
          </div>
        ))}
        {visibleTools.length === 0 && <p className="hint">No equipment matches that filter.</p>}
      </div>
    </div>
  );
}
