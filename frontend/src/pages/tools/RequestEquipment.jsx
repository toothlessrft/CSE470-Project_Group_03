// Request Excavation Tools & Field Equipment
//
// Shared by archaeologists and excavation teams. The backend only lets the
// lead archaeologist or the assigned team of an *active* project request
// equipment, so if this page shows no projects there is nothing to request for.
import { useEffect, useMemo, useState } from "react";
import { Wrench, PackageCheck, AlertTriangle, Undo2, X, PlusCircle, ClipboardList, Boxes, ArrowLeft } from "lucide-react";
import { api } from "../../api";
import StatusBadge from "../../components/StatusBadge";

// The 3 sections used to be stacked and scrolled through; now they're picked
// via these cards, same look as the dashboard's own 3-box action grids.
const SECTIONS = [
  { key: "new", icon: PlusCircle, title: "New Request", description: "Request a tool or piece of field equipment for an active project." },
  { key: "mine", icon: ClipboardList, title: "My Requests", description: "Track what you've requested, and mark equipment returned." },
  { key: "catalogue", icon: Boxes, title: "Equipment Catalogue", description: "Browse everything available across the tool inventory." },
];

const EMPTY_FORM = {
  tool_id: "",
  project_id: "",
  quantity: 1,
  start_date: "",
  end_date: "",
  purpose: "",
};

export default function RequestEquipment() {
  const [section, setSection] = useState(null);
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

  if (loading)
    return (
      <div className="page">
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading the equipment store
        </div>
      </div>
    );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Field logistics</span>
          <h1>Field equipment</h1>
          <p className="page-subtitle">
            Draw tools and instruments from the national store for the excavations you are running,
            and keep track of what is signed out to you.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {projects.length === 0 && (
        <div className="alert alert-warning">
          <AlertTriangle size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            You are not leading or assigned to an active excavation, so there is nothing to draw
            equipment for yet.
          </span>
        </div>
      )}

      {section ? (
        <button type="button" className="back-link" onClick={() => setSection(null)}>
          <ArrowLeft size={14} aria-hidden="true" /> Back to field equipment
        </button>
      ) : (
        <div className="action-grid">
          {SECTIONS.map(({ key, icon: Icon, title, description }) => (
            <button
              type="button"
              key={key}
              className="action-card"
              style={{ cursor: "pointer", textAlign: "left", font: "inherit", width: "100%" }}
              onClick={() => setSection(key)}
            >
              <span className="action-icon" aria-hidden="true">
                <Icon size={19} strokeWidth={2} />
              </span>
              <div>
                <h4>{title}</h4>
                <p>{description}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ---- Request form ---- */}
      {section === "new" && projects.length === 0 && (
        <p className="hint">Nothing to request yet — see the notice above.</p>
      )}
      {section === "new" && projects.length > 0 && (
        <>
          <h2 className="section-title">New request</h2>
          <form className="form" onSubmit={handleSubmit}>
            <label>
              Excavation project
              <select
                value={form.project_id}
                onChange={(e) => update("project_id", e.target.value)}
                required
              >
                <option value="">Choose a project</option>
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
                <option value="">Choose an item</option>
                {tools
                  .filter((t) => t.requestable)
                  .map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.type} ({t.model_no}) — {t.available_units} available
                    </option>
                  ))}
              </select>
            </label>

            {selectedTool && (
              <p className="hint">
                Owned by {selectedTool.owner}
                {selectedTool.hazard ? ` · hazard: ${selectedTool.hazard}` : ""}
                {selectedTool.insurance_info ? ` · insurance: ${selectedTool.insurance_info}` : ""}
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

            <div className="form-row">
              <label>
                Collect on
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => update("start_date", e.target.value)}
                  required
                />
              </label>

              <label>
                Return by
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => update("end_date", e.target.value)}
                  required
                />
              </label>
            </div>

            <label>
              Intended use
              <textarea
                value={form.purpose}
                onChange={(e) => update("purpose", e.target.value)}
                placeholder="What the equipment will be used for on site"
                required
              />
            </label>

            <button type="submit" className="btn" disabled={busy}>
              <Wrench size={15} aria-hidden="true" /> {busy ? "Submitting" : "Submit request"}
            </button>
          </form>
        </>
      )}

      {/* ---- My requests ---- */}
      {section === "mine" && (
      <>
      <h2 className="section-title">My requests</h2>
      <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Equipment</th>
            <th>Project</th>
            <th>Units</th>
            <th>Period</th>
            <th>Status</th>
            <th>Action</th>
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
                      <X size={13} aria-hidden="true" /> Withdraw
                    </button>
                  )}
                  {r.approval_status === "Approved" && !r.returned_at && (
                    <button className="btn-small btn-approve" onClick={() => markReturned(r._id)}>
                      <Undo2 size={13} aria-hidden="true" /> Record return
                    </button>
                  )}
                  {r.returned_at && (
                    <span className="hint">
                      <PackageCheck size={13} aria-hidden="true" style={{ verticalAlign: "-2px" }} /> Returned{" "}
                      {r.returned_at.slice(0, 10)}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
          {requests.length === 0 && (
            <tr>
              <td colSpan={6} className="hint">
                You have not requested any equipment yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
      </>
      )}

      {/* ---- Catalogue ---- */}
      {section === "catalogue" && (
      <>
      <h2 className="section-title">Equipment catalogue</h2>
      <div className="inv-toolbar">
        <input
          type="search"
          placeholder="Search by type, model, or owning body"
          aria-label="Search the equipment catalogue"
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
              {t.model_no} · {t.owner}
            </p>
            {t.hazard && <p className="inv-card-meta">Hazard: {t.hazard}</p>}
            <div className="inv-stock">
              <span>
                <strong>{t.available_units}</strong>
                available
              </span>
              <span className="inv-out">
                <strong>{t.assigned_units}</strong>
                on issue
              </span>
              <span>
                <strong>{t.quantity_total}</strong>
                held
              </span>
            </div>
            {t.status !== "In Service" && <p className="inv-overdue">{t.status}</p>}
          </div>
        ))}
        {visibleTools.length === 0 && (
          <p className="hint">No equipment matches this search.</p>
        )}
      </div>
      </>
      )}
    </div>
  );
}
