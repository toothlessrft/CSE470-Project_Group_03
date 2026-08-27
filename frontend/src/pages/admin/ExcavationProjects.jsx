// Ahad_23201016 - Government view of every excavation project created through
// the tender process. Once a dig is completed and handed over, the admin
// allocates each recovered artifact here (museum storage or auction) using the
// existing allocation endpoint. Anything sent to Auction becomes a candidate in
// Manage Auctions, and allocating releases it into Smart Artifact Search.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderKanban,
  Banknote,
  CalendarDays,
  Package,
  Users,
  MapPin,
  CheckCircle2,
  Gavel,
  ArrowRight,
} from "lucide-react";
import { api } from "../../api";
import SearchableSelect from "../../components/SearchableSelect";
import StatusBadge from "../../components/StatusBadge";
import { MUSEUMS } from "../../data/museums";

const TABS = ["Awaiting Allocation", "Active", "All"];

export default function ExcavationProjects() {
  const [tab, setTab] = useState("Awaiting Allocation");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [forms, setForms] = useState({}); // itemId -> { destination, museumName }
  const [busyId, setBusyId] = useState(null);

  function load() {
    setLoading(true);
    api
      .get("/tenders/admin/projects")
      .then((data) => setProjects(data.projects))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function updateForm(itemId, patch) {
    setForms((prev) => ({
      ...prev,
      [itemId]: { destination: "Museum", museumName: "", ...prev[itemId], ...patch },
    }));
  }

  async function allocate(itemId) {
    const form = forms[itemId] || { destination: "Museum", museumName: "" };
    setError("");
    setSuccess("");
    setBusyId(itemId);
    try {
      const data = await api.post(`/admin/artifacts/${itemId}/allocate`, {
        destination: form.destination,
        museumName: form.museumName,
      });
      setSuccess(
        `${data.item.name} allocated to ${
          form.destination === "Museum" ? form.museumName : "auction"
        }. It now appears in Smart Artifact Search.`
      );
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const visible = projects.filter((p) => {
    if (tab === "All") return true;
    if (tab === "Active") return !p.end_date;
    // Mirrors the "excavation_projects" badge query on the backend: only a
    // completed dig that actually recovered something and isn't fully
    // allocated yet counts as awaiting allocation.
    return Boolean(p.end_date) && !p.allocation_done && (p.artifacts?.length || 0) > 0;
  });

  if (loading)
    return (
      <div className="page">
        <p className="hint">Loading excavation projects...</p>
      </div>
    );

  return (
    <div className="page">
      <h1>Excavation Projects</h1>
      <p className="page-subtitle">
        Projects created from awarded tenders. When a dig is handed over, allocate each recovered
        artifact to a museum or send it to auction.
      </p>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? "tab-active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
          <FolderKanban size={28} style={{ marginBottom: "0.5rem" }} />
          <p style={{ margin: 0 }}>
            Nothing here yet. <Link to="/admin/tenders">Publish a tender</Link> to start an
            excavation.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {visible.map((p) => {
            const complete = Boolean(p.end_date);
            const pending = (p.artifacts || []).filter((a) => a.pending_allocation);
            return (
              <div
                key={p._id}
                className="card"
                style={{
                  margin: 0,
                  borderLeft: `4px solid ${
                    complete ? (p.allocation_done ? "var(--success)" : "#c98a4b") : "#2980b9"
                  }`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem" }}>{p.p_name}</h3>
                    <p className="hint" style={{ margin: 0 }}>
                      <MapPin size={13} style={{ verticalAlign: "middle" }} />{" "}
                      {p.site?.name || p.location?.address || "No site"}
                    </p>
                  </div>
                  <StatusBadge
                    status={complete ? (p.allocation_done ? "Approved" : "Pending") : "Active"}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "1.5rem",
                    flexWrap: "wrap",
                    margin: "1rem 0",
                    fontSize: "0.88rem",
                    color: "var(--muted)",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Users size={15} /> {p.excavation_team?.company_name || "—"}
                  </span>
                  {p.budget != null && (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Banknote size={15} /> ৳{p.budget.toLocaleString()}
                    </span>
                  )}
                  {p.start_date && (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <CalendarDays size={15} /> {p.start_date.slice(0, 10)}
                      {p.end_date ? ` → ${p.end_date.slice(0, 10)}` : ""}
                    </span>
                  )}
                  <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Package size={15} /> {p.artifacts?.length || 0} artifact
                    {(p.artifacts?.length || 0) === 1 ? "" : "s"}
                  </span>
                  <Link
                    to={`/admin/excavation-projects/${p._id}`}
                    style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 600 }}
                  >
                    Open project <ArrowRight size={13} />
                  </Link>
                </div>

                {p.lead_archaeologist && (
                  <p className="hint" style={{ marginTop: 0 }}>
                    Lead archaeologist: {p.lead_archaeologist.name} ({p.lead_archaeologist.nid})
                  </p>
                )}

                {!complete ? (
                  <div className="alert alert-info" style={{ marginBottom: 0 }}>
                    Excavation in progress — artifacts will be available for allocation once the team
                    submits the completed project.
                  </div>
                ) : p.artifacts?.length === 0 ? (
                  <div className="alert alert-info" style={{ marginBottom: 0 }}>
                    This excavation was completed with no artifacts recovered.
                  </div>
                ) : (
                  <>
                    {p.completion_notes && (
                      <p style={{ fontSize: "0.9rem" }}>
                        <strong>Handover notes:</strong> {p.completion_notes}
                      </p>
                    )}
                    <h4>
                      Artifact Allocation{" "}
                      {pending.length === 0 && (
                        <CheckCircle2
                          size={15}
                          style={{ verticalAlign: "middle", color: "var(--success)" }}
                        />
                      )}
                    </h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
                        gap: "0.9rem",
                      }}
                    >
                      {p.artifacts.map((item) => {
                        const form = forms[item._id] || {
                          destination: "Museum",
                          museumName: item.museumName || "",
                        };
                        return (
                          <div
                            key={item._id}
                            className="card"
                            style={{ margin: 0, padding: "0.9rem 1.1rem" }}
                          >
                            <strong>{item.name}</strong>
                            <p className="hint" style={{ margin: "0.2rem 0" }}>
                              {item.Type}
                              {item.material ? ` · ${item.material}` : ""}
                            </p>
                            {item.description && (
                              <p style={{ fontSize: "0.85rem" }}>{item.description}</p>
                            )}

                            {!item.pending_allocation ? (
                              <div className="alert alert-success" style={{ margin: "0.5rem 0 0" }}>
                                {item.allocation === "Museum" ? (
                                  <>Allocated to {item.museumName}</>
                                ) : (
                                  <>
                                    <Gavel size={13} style={{ verticalAlign: "middle" }} /> Sent to
                                    auction — create the listing in{" "}
                                    <Link to="/admin/auctions/new">Manage Auctions</Link>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="form" style={{ gap: "0.75rem", marginTop: "0.5rem" }}>
                                <label>
                                  Send to
                                  <select
                                    value={form.destination}
                                    onChange={(e) =>
                                      updateForm(item._id, { destination: e.target.value })
                                    }
                                  >
                                    <option value="Museum">Museum Storage</option>
                                    <option value="Auction">Auction</option>
                                  </select>
                                </label>
                                {form.destination === "Museum" && (
                                  <label>
                                    Museum name
                                    <SearchableSelect
                                      options={MUSEUMS}
                                      value={form.museumName}
                                      onChange={(value) => updateForm(item._id, { museumName: value })}
                                      placeholder="Search the museum to store this artifact..."
                                      required
                                    />
                                  </label>
                                )}
                                <button
                                  type="button"
                                  className="btn-small"
                                  disabled={busyId === item._id}
                                  onClick={() => allocate(item._id)}
                                >
                                  {busyId === item._id ? "Saving..." : "Save Allocation"}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
