// Ahad_23201016 - admin view of every project created through the tender
// process. Once a dig is handed over, each recovered artifact is allocated
// here: a museum, or auction (which lists it in Manage Auctions). Allocating
// is also what releases the artifact into the public catalogue.
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
    // Mirrors the backend's excavation_projects badge query: a dig only counts
    // as awaiting allocation if it finished, recovered something, and is not
    // fully allocated yet.
    return Boolean(p.end_date) && !p.allocation_done && (p.artifacts?.length || 0) > 0;
  });

  if (loading)
    return (
      <div className="page">
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading excavation projects
        </div>
      </div>
    );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Custody</span>
          <h1>Excavation projects</h1>
          <p className="page-subtitle">
            Projects opened from awarded tenders. Once an excavation is handed over, allocate every
            recovered artifact to a museum or release it to auction.
          </p>
        </div>
      </div>

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
        <div className="empty-state">
          <FolderKanban size={26} aria-hidden="true" />
          <h3>No projects here</h3>
          <p>Projects open automatically once a tender is awarded to a contractor.</p>
          <Link className="btn" to="/admin/tenders">
            Go to tenders
          </Link>
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
                  borderLeft: `3px solid ${
                    complete ? (p.allocation_done ? "var(--success)" : "var(--accent)") : "#1d4ed8"
                  }`,
                }}
              >
                <div className="report-header">
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: "0 0 0.2rem" }}>{p.p_name}</h3>
                    <p className="meta-row">
                      <span>
                        <MapPin size={13} aria-hidden="true" />{" "}
                        {p.site?.name || p.location?.address || "No site recorded"}
                      </span>
                      {p.lead_archaeologist && (
                        <span>Lead: {p.lead_archaeologist.name}</span>
                      )}
                    </p>
                  </div>
                  <StatusBadge
                    status={complete ? (p.allocation_done ? "Approved" : "Pending") : "Active"}
                  />
                </div>

                <dl className="detail-list" style={{ margin: "1.1rem 0" }}>
                  <div>
                    <dt>
                      <Users size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Contractor
                    </dt>
                    <dd>{p.excavation_team?.company_name || "Not recorded"}</dd>
                  </div>
                  {p.budget != null && (
                    <div>
                      <dt>
                        <Banknote size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Contract value
                      </dt>
                      <dd className="num">৳{p.budget.toLocaleString()}</dd>
                    </div>
                  )}
                  {p.start_date && (
                    <div>
                      <dt>
                        <CalendarDays size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Period
                      </dt>
                      <dd className="num">
                        {p.start_date.slice(0, 10)}
                        {p.end_date ? ` to ${p.end_date.slice(0, 10)}` : " — ongoing"}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt>
                      <Package size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Artifacts
                    </dt>
                    <dd className="num">{p.artifacts?.length || 0}</dd>
                  </div>
                </dl>

                <Link
                  className="btn-small btn-secondary"
                  to={`/admin/excavation-projects/${p._id}`}
                  style={{ marginBottom: "1rem" }}
                >
                  Open project <ArrowRight size={13} aria-hidden="true" />
                </Link>

                {!complete ? (
                  <div className="alert alert-info" style={{ marginBottom: 0 }}>
                    Excavation in progress. Recovered artifacts become available for allocation once
                    the contractor closes the project.
                  </div>
                ) : p.artifacts?.length === 0 ? (
                  <div className="alert alert-info" style={{ marginBottom: 0 }}>
                    This excavation closed with no artifacts recovered.
                  </div>
                ) : (
                  <>
                    {p.completion_notes && (
                      <div className="subtle" style={{ marginBottom: "1rem" }}>
                        <span className="stat-label">Handover notes</span>
                        <p style={{ margin: "0.2rem 0 0", fontSize: "0.875rem" }}>
                          {p.completion_notes}
                        </p>
                      </div>
                    )}
                    <h4 className="section-title">
                      Artifact allocation
                      {pending.length === 0 && (
                        <CheckCircle2
                          size={15}
                          aria-hidden="true"
                          style={{ verticalAlign: "-2px", marginLeft: "0.4rem", color: "var(--success)" }}
                        />
                      )}
                    </h4>
                    <div className="artifact-grid">
                      {p.artifacts.map((item) => {
                        const form = forms[item._id] || {
                          destination: "Museum",
                          museumName: item.museumName || "",
                        };
                        return (
                          <div key={item._id} className="artifact-tile">
                            <div className="artifact-tile-head">
                              <strong>{item.name}</strong>
                            </div>
                            <p className="artifact-tile-class">
                              {item.Type}
                              {item.material ? ` · ${item.material}` : ""}
                            </p>
                            {item.description && (
                              <p className="artifact-tile-desc">{item.description}</p>
                            )}

                            {!item.pending_allocation ? (
                              <div className="alert alert-success" style={{ margin: "0.5rem 0 0" }}>
                                <span>
                                  {item.allocation === "Museum" ? (
                                    <>Allocated to {item.museumName}</>
                                  ) : (
                                    <>
                                      <Gavel size={13} aria-hidden="true" style={{ verticalAlign: "-1px" }} />{" "}
                                      Released to auction — create the lot in{" "}
                                      <Link to="/admin/auctions/new">artifact auctions</Link>
                                    </>
                                  )}
                                </span>
                              </div>
                            ) : (
                              <div className="form" style={{ gap: "0.75rem", marginTop: "0.75rem" }}>
                                <label>
                                  Allocate to
                                  <select
                                    value={form.destination}
                                    onChange={(e) =>
                                      updateForm(item._id, { destination: e.target.value })
                                    }
                                  >
                                    <option value="Museum">A museum collection</option>
                                    <option value="Auction">Public auction</option>
                                  </select>
                                </label>
                                {form.destination === "Museum" && (
                                  <label>
                                    Receiving museum
                                    <SearchableSelect
                                      options={MUSEUMS}
                                      value={form.museumName}
                                      onChange={(value) => updateForm(item._id, { museumName: value })}
                                      placeholder="Search for the receiving museum"
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
                                  {busyId === item._id ? "Saving" : "Confirm allocation"}
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
