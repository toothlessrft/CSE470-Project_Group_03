// Ahad_23201016 - Tender Publication & Management (Government):
// create a new excavation tender specifying project details, location,
// requirements, deadline, and estimated budget.
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { api } from "../../api";
import GoogleMapPicker from "../../components/GoogleMapPicker";

export default function CreateTender() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("report") || "";

  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [fieldReportId, setFieldReportId] = useState("");
  const [form, setForm] = useState({
    title: "",
    project_details: "",
    requirements: "",
    deadline: "",
    estimated_budget: "",
  });

  useEffect(() => {
    api
      .get("/tenders/admin/sources")
      .then((data) => {
        setSources(data.sources);
        // Coming straight from "Publish Excavation Tender" on a field report
        const match = data.sources.find((s) => String(s._id) === preselected);
        if (match) applySource(match);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselected]);

  function applySource(source) {
    setFieldReportId(source._id);
    setForm((f) => ({
      ...f,
      title: f.title || `Excavation - ${source.discoveryReport?.material || "Verified Discovery"}`,
      project_details:
        f.project_details ||
        `Excavation of a verified discovery reported at ${
          source.discoveryReport?.location?.address || "the recorded coordinates"
        }. Field report by ${source.researcher?.name || "the assigned archaeologist"}.${
          source.notes ? ` Findings: ${source.notes}` : ""
        }`,
      estimated_budget: f.estimated_budget || source.budgetRequested || "",
    }));
  }

  function handleSourceChange(id) {
    if (!id) {
      setFieldReportId("");
      return;
    }
    const source = sources.find((s) => String(s._id) === id);
    if (source) applySource(source);
  }

  const selected = sources.find((s) => String(s._id) === String(fieldReportId));
  const location = selected?.discoveryReport?.location || null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await api.post("/tenders/admin", {
        ...form,
        estimated_budget: Number(form.estimated_budget),
        field_report_id: fieldReportId || undefined,
        location: location || undefined,
      });
      navigate(`/admin/tenders/${data.tender._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading)
    return (
      <div className="page">
        <p className="hint">Loading approved field reports...</p>
      </div>
    );

  return (
    <div className="page narrow">
      <p>
        <Link className="back-link" to="/admin/tenders">
          <ArrowLeft size={14} aria-hidden="true" /> Back to tenders
        </Link>
      </p>

      <div className="page-head">
        <div>
          <span className="eyebrow">Procurement</span>
          <h1>Publish an excavation tender</h1>
          <p className="page-subtitle">
            Put an excavation contract out to tender so licensed contractors can bid for the work.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {sources.length === 0 && !fieldReportId && (
        <div className="alert alert-info">
          <FileText size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            No approved field report is currently awaiting an excavation. You can still publish a
            standalone tender, but it will not be linked to a reported discovery.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form card">
        <label>
          Source field report
          <select value={fieldReportId} onChange={(e) => handleSourceChange(e.target.value)}>
            <option value="">Standalone tender — no linked report</option>
            {sources.map((s) => (
              <option key={s._id} value={s._id}>
                {s.discoveryReport?.material} — {s.discoveryReport?.location?.address || "no address"}
                {s.researcher ? ` (${s.researcher.name})` : ""}
              </option>
            ))}
          </select>
        </label>

        {selected && (
          <div className="alert alert-info" style={{ marginBottom: 0 }}>
            <span>
              Linked to the field report filed by <strong>{selected.researcher?.name}</strong>, who
              recommended a full excavation.
              {selected.budgetRequested != null && (
                <> Budget requested: ৳{selected.budgetRequested.toLocaleString()}.</>
              )}
            </span>
          </div>
        )}

        <label>
          Tender title
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Lalbagh Mughal Mint Excavation"
            required
          />
        </label>

        <label>
          Scope of work
          <textarea
            rows={5}
            value={form.project_details}
            onChange={(e) => setForm({ ...form, project_details: e.target.value })}
            placeholder="Extent of the dig, what has already been verified, expected depth and area"
            required
          />
        </label>

        <label>
          Contractor requirements
          <textarea
            rows={4}
            value={form.requirements}
            onChange={(e) => setForm({ ...form, requirements: e.target.value })}
            placeholder="Equipment, crew size, licences held, recording and conservation standards"
          />
        </label>

        <div className="form-row">
          <label>
            Bids close
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              required
            />
          </label>
          <label>
            Estimated budget (৳)
            <input
              type="number"
              min="0"
              step="1000"
              value={form.estimated_budget}
              onChange={(e) => setForm({ ...form, estimated_budget: e.target.value })}
              placeholder="e.g. 500000"
              required
            />
          </label>
        </div>

        <fieldset>
          <legend>Site location</legend>
          {location?.lat != null ? (
            <>
              <p className="hint" style={{ margin: "0 0 0.6rem" }}>
                Taken from the linked discovery report — this is exactly where the find was
                reported.
              </p>
              <GoogleMapPicker value={location} editable={false} height={240} />
              <p className="hint" style={{ margin: "0.5rem 0 0" }}>
                {location.address || `${location.lat}, ${location.lng}`}
              </p>
            </>
          ) : (
            <p className="hint" style={{ margin: 0 }}>
              Choose a source field report above to carry across its verified location.
            </p>
          )}
        </fieldset>

        <button type="submit" className="btn" disabled={busy}>
          {busy ? "Publishing" : "Publish tender"}
        </button>
      </form>
    </div>
  );
}
