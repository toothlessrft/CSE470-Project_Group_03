// Inventory Tracking - Government/Admin view.
//
// Three tabs over one dataset: the requests waiting on a decision, what is
// currently out across the active excavation zones, and the equipment store
// itself (add / edit / retire).
import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, PackageCheck, MapPinned } from "lucide-react";
import { api } from "../../api";
import StatusBadge from "../../components/StatusBadge";

const CATEGORIES = [
  "Hand Tool",
  "Survey Equipment",
  "Imaging & Remote Sensing",
  "Excavation Machinery",
  "Power & Site Support",
  "Conservation & Storage",
  "Safety Gear",
  "Other",
];
const CONDITIONS = ["Excellent", "Good", "Fair", "Needs Repair"];
const STATUSES = ["In Service", "Maintenance", "Retired"];

const BLANK_TOOL = {
  model_no: "",
  type: "",
  owner: "",
  category: "Other",
  quantity_total: 1,
  condition: "Good",
  status: "In Service",
  home_location: "",
  insurance_info: "",
  hazard: "",
};

export default function ToolInventory() {
  const [tab, setTab] = useState("requests");

  const [requests, setRequests] = useState([]);
  const [zones, setZones] = useState([]);
  const [tools, setTools] = useState([]);

  const [newTool, setNewTool] = useState(BLANK_TOOL);
  const [showAdd, setShowAdd] = useState(false);
  const [edits, setEdits] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function loadAll() {
    setLoading(true);
    Promise.all([
      api.get("/inventory/requests"),
      api.get("/inventory/assignments"),
      api.get("/inventory/tools"),
    ])
      .then(([requestData, zoneData, toolData]) => {
        setRequests(requestData.requests || []);
        setZones(zoneData.zones || []);
        setTools(toolData.tools || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(loadAll, []);

  const pending = useMemo(
    () => requests.filter((r) => r.approval_status === "Pending"),
    [requests]
  );
  const decided = useMemo(
    () => requests.filter((r) => r.approval_status !== "Pending"),
    [requests]
  );

  async function run(fn, successMessage) {
    setError("");
    setMessage("");
    try {
      await fn();
      if (successMessage) setMessage(successMessage);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  function decide(id, action) {
    const note =
      action === "deny"
        ? window.prompt("Reason for denying this request (optional):") ?? ""
        : window.prompt("Note for the requester (optional):") ?? "";
    return run(
      () => api.post(`/inventory/requests/${id}/decision`, { action, note }),
      `Request ${action === "approve" ? "approved" : "denied"}.`
    );
  }

  function addTool(e) {
    e.preventDefault();
    return run(async () => {
      await api.post("/inventory/tools", newTool);
      setNewTool(BLANK_TOOL);
      setShowAdd(false);
    }, "Equipment added to the inventory.");
  }

  function saveTool(tool) {
    const patch = edits[tool._id];
    if (!patch) return undefined;
    return run(async () => {
      await api.patch(`/inventory/tools/${tool._id}`, patch);
      setEdits((prev) => {
        const next = { ...prev };
        delete next[tool._id];
        return next;
      });
    }, "Equipment updated.");
  }

  function editField(id, field, value) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  function valueFor(tool, field) {
    return edits[tool._id]?.[field] ?? tool[field];
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
          <h1>Equipment inventory</h1>
          <p className="page-subtitle">
            Decide on equipment requests, track what is issued to each excavation zone, and hold
            stock levels for the national store.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="tabs">
        <button
          className={`tab${tab === "requests" ? " tab-active" : ""}`}
          onClick={() => setTab("requests")}
        >
          Requests <span className="tab-count">{pending.length}</span>
        </button>
        <button
          className={`tab${tab === "zones" ? " tab-active" : ""}`}
          onClick={() => setTab("zones")}
        >
          Assigned across zones
        </button>
        <button className={`tab${tab === "store" ? " tab-active" : ""}`} onClick={() => setTab("store")}>
          Equipment store <span className="tab-count">{tools.length}</span>
        </button>
      </div>

      {/* ---------------- Requests ---------------- */}
      {tab === "requests" && (
        <>
          <h2 className="section-title">Awaiting decision</h2>
          <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Requested by</th>
                <th>Equipment</th>
                <th>Zone</th>
                <th>Units</th>
                <th>Period</th>
                <th>Intended use</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((r) => (
                <tr key={r._id}>
                  <td>
                    {r.user?.name}
                    <br />
                    <span className="hint">{r.user?.role?.replace("_", " ")}</span>
                  </td>
                  <td>
                    {r.tool?.type}
                    <br />
                    <span className="hint">{r.tool?.model_no}</span>
                  </td>
                  <td>{r.project?.p_name || "-"}</td>
                  <td>{r.quantity ?? 1}</td>
                  <td>
                    {r.start_date?.slice(0, 10)}
                    <br />
                    to {r.end_date?.slice(0, 10)}
                  </td>
                  <td>{r.purpose}</td>
                  <td className="actions">
                    <button className="btn-small btn-approve" onClick={() => decide(r._id, "approve")}>
                      Approve
                    </button>
                    <button className="btn-small btn-deny" onClick={() => decide(r._id, "deny")}>
                      Decline
                    </button>
                  </td>
                </tr>
              ))}
              {pending.length === 0 && (
                <tr>
                  <td colSpan={7} className="hint">
                    Nothing awaiting a decision.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          <h2 className="section-title">Decision record</h2>
          <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Requested by</th>
                <th>Equipment</th>
                <th>Units</th>
                <th>Outcome</th>
                <th>Returned</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {decided.map((r) => (
                <tr key={r._id}>
                  <td>{r.user?.name}</td>
                  <td>
                    {r.tool?.type} <span className="hint">({r.tool?.model_no})</span>
                  </td>
                  <td>{r.quantity ?? 1}</td>
                  <td>
                    <StatusBadge status={r.approval_status} />
                  </td>
                  <td className="num">{r.returned_at ? r.returned_at.slice(0, 10) : "—"}</td>
                  <td className="actions">
                    {r.approval_status === "Approved" && !r.returned_at && (
                      <button
                        className="btn-small btn-approve"
                        onClick={() =>
                          run(
                            () => api.post(`/inventory/requests/${r._id}/check-in`, {}),
                            "Equipment checked in."
                          )
                        }
                      >
                        <PackageCheck size={13} aria-hidden="true" /> Record return
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {decided.length === 0 && (
                <tr>
                  <td colSpan={6} className="hint">
                    No decisions on record yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </>
      )}

      {/* ---------------- Zones ---------------- */}
      {tab === "zones" && (
        <div style={{ marginTop: "1.4rem" }}>
          {zones.length === 0 && (
            <div className="empty-state">
              <MapPinned size={24} aria-hidden="true" />
              <h3>Nothing on issue</h3>
              <p>No equipment is currently out with an excavation zone.</p>
            </div>
          )}
          {zones.map((zone) => (
            <div className="inv-zone" key={zone.project_id || zone.zone}>
              <h4>
                <MapPinned size={15} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: "0.35rem" }} />
                {zone.zone}
                {!zone.active && <span className="hint"> (closed project)</span>}
              </h4>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Equipment</th>
                    <th>Units</th>
                    <th>Held by</th>
                    <th>Due back</th>
                  </tr>
                </thead>
                <tbody>
                  {zone.items.map((item) => (
                    <tr key={item._id}>
                      <td>{item.tool?.label || "-"}</td>
                      <td>{item.quantity}</td>
                      <td>
                        {item.holder}
                        <br />
                        <span className="hint">{item.holder_role?.replace("_", " ")}</span>
                      </td>
                      <td className={item.overdue ? "inv-overdue" : undefined}>
                        {item.end_date?.slice(0, 10)}
                        {item.overdue ? " (overdue)" : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* ---------------- Store ---------------- */}
      {tab === "store" && (
        <>
          <div className="inv-toolbar">
            <button
              className={showAdd ? "btn-small btn-secondary" : "btn-small"}
              onClick={() => setShowAdd((v) => !v)}
            >
              <Plus size={13} aria-hidden="true" /> {showAdd ? "Cancel" : "Add equipment"}
            </button>
          </div>

          {showAdd && (
            <form className="form card" onSubmit={addTool}>
              <h3 style={{ margin: 0 }}>Add to the equipment store</h3>
              <div className="form-row">
              <label>
                Model number
                <input
                  value={newTool.model_no}
                  onChange={(e) => setNewTool({ ...newTool, model_no: e.target.value })}
                  required
                />
              </label>
              <label>
                Type
                <input
                  value={newTool.type}
                  onChange={(e) => setNewTool({ ...newTool, type: e.target.value })}
                  required
                />
              </label>
              <label>
                Owning body
                <input
                  value={newTool.owner}
                  onChange={(e) => setNewTool({ ...newTool, owner: e.target.value })}
                  required
                />
              </label>
              <label>
                Category
                <select
                  value={newTool.category}
                  onChange={(e) => setNewTool({ ...newTool, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Total units
                <input
                  type="number"
                  min="0"
                  value={newTool.quantity_total}
                  onChange={(e) => setNewTool({ ...newTool, quantity_total: e.target.value })}
                />
              </label>
              <label>
                Condition
                <select
                  value={newTool.condition}
                  onChange={(e) => setNewTool({ ...newTool, condition: e.target.value })}
                >
                  {CONDITIONS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Stored at
                <input
                  value={newTool.home_location}
                  onChange={(e) => setNewTool({ ...newTool, home_location: e.target.value })}
                />
              </label>
              <label>
                Hazard notes
                <input
                  value={newTool.hazard}
                  onChange={(e) => setNewTool({ ...newTool, hazard: e.target.value })}
                />
              </label>
              <label>
                Insurance
                <input
                  value={newTool.insurance_info}
                  onChange={(e) => setNewTool({ ...newTool, insurance_info: e.target.value })}
                />
              </label>
              </div>
              <button type="submit" className="btn">
                <Plus size={15} aria-hidden="true" /> Add to the store
              </button>
            </form>
          )}

          <div className="table-wrap" style={{ marginTop: "1.2rem" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Category</th>
                <th>Held</th>
                <th>On issue</th>
                <th>Available</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((t) => (
                <tr key={t._id}>
                  <td>
                    {t.type}
                    <br />
                    <span className="hint">
                      {t.model_no} | {t.owner}
                    </span>
                  </td>
                  <td>{t.category}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      className="inline-input"
                      style={{ width: "62px" }}
                      value={valueFor(t, "quantity_total")}
                      onChange={(e) => editField(t._id, "quantity_total", e.target.value)}
                    />
                  </td>
                  <td>{t.assigned_units}</td>
                  <td>
                    <strong>{t.available_units}</strong>
                  </td>
                  <td>
                    <select
                      value={valueFor(t, "status")}
                      onChange={(e) => editField(t._id, "status", e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="actions">
                    {edits[t._id] && (
                      <button className="btn-small btn-approve" onClick={() => saveTool(t)}>
                        <Save size={13} aria-hidden="true" /> Save
                      </button>
                    )}
                    <button
                      className="btn-small btn-deny"
                      onClick={() =>
                        run(() => api.del(`/inventory/tools/${t._id}`), "Equipment removed.")
                      }
                    >
                      <Trash2 size={13} aria-hidden="true" /> Remove
                    </button>
                  </td>
                </tr>
              ))}
              {tools.length === 0 && (
                <tr>
                  <td colSpan={7} className="hint">
                    The equipment store is empty.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  );
}
