import { useEffect, useState } from "react";
import { MapPin, Clock, Ticket, Pencil } from "lucide-react";
import { api } from "../../api";
import GoogleMapPicker from "../../components/GoogleMapPicker";

const EMPTY_FORM = { address: "", operating_hours: "", ticket_info: "" };

export default function MuseumProfile() {
  const [profile, setProfile] = useState(null); // { museum_name, address, location, operating_hours, ticket_info }
  const [mode, setMode] = useState("view"); // "view" | "edit"
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    load();
  }, []);

  function flashSuccess(message) {
    setSuccessMsg(message);
    window.setTimeout(() => setSuccessMsg(""), 4000);
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/mm/museum-profile");
      setProfile(data.profile);
      // Nothing filled in yet, so open straight into editing rather than an
      // empty preview.
      const isEmpty = !data.profile.address && !data.profile.operating_hours && !data.profile.ticket_info && !data.profile.location;
      setMode(isEmpty ? "edit" : "view");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startEdit() {
    setForm({
      address: profile.address || "",
      operating_hours: profile.operating_hours || "",
      ticket_info: profile.ticket_info || "",
    });
    setLocation(profile.location || null);
    setError("");
    setMode("edit");
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
        const data = await api.put("/mm/museum-profile", { ...form, location });
      setProfile(data.profile);
      setMode("view");
      flashSuccess("Museum profile updated. These details are now public.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="page">
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading museum profile
        </div>
      </div>
    );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Public listing</span>
          <h1>Museum profile</h1>
          <p className="page-subtitle">
            {profile?.museum_name
              ? `Visitor information for ${profile.museum_name}.`
              : "Visitor information for your museum."}{" "}
            These details appear in the museum directory and in location searches.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {mode === "view" ? (
        <div className="panel">
          <div className="panel-head">
            <h2>{profile.museum_name}</h2>
            <button type="button" className="btn-small btn-secondary" onClick={startEdit}>
              <Pencil size={14} aria-hidden="true" /> Edit details
            </button>
          </div>

          <div className="panel-body">
            <dl className="detail-list" style={{ marginBottom: "1.25rem" }}>
              <div>
                <dt>
                  <MapPin size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Address
                </dt>
                <dd>{profile.address || <span className="hint">Not set</span>}</dd>
              </div>
              <div>
                <dt>
                  <Clock size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Opening hours
                </dt>
                <dd>{profile.operating_hours || <span className="hint">Not set</span>}</dd>
              </div>
              <div>
                <dt>
                  <Ticket size={11} aria-hidden="true" style={{ verticalAlign: "-1px" }} /> Admission
                </dt>
                <dd>{profile.ticket_info || <span className="hint">Not set</span>}</dd>
              </div>
            </dl>

            {profile.location?.lat != null ? (
              <GoogleMapPicker value={profile.location} editable={false} />
            ) : (
              <div className="alert alert-warning" style={{ marginBottom: 0 }}>
                No map location has been set. Your museum will not appear in location searches until
                one is added.
              </div>
            )}
          </div>
        </div>
      ) : (
        <form className="card form" onSubmit={handleSave}>
          <h3 style={{ margin: 0 }}>Visitor information</h3>
          <label>
            Address
            <input
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              placeholder="Street, city"
            />
          </label>

          <label>
            Operating hours
            <input
              value={form.operating_hours}
              onChange={(e) => setForm((p) => ({ ...p, operating_hours: e.target.value }))}
              placeholder="e.g. Sat–Thu 10:00 AM – 5:00 PM, closed Fridays"
            />
          </label>

          <label>
            Admission and ticketing
            <input
              value={form.ticket_info}
              onChange={(e) => setForm((p) => ({ ...p, ticket_info: e.target.value }))}
              placeholder="e.g. ৳50 entry, or a link to buy tickets"
            />
          </label>

          <label>
            Map location
            <GoogleMapPicker value={location} onChange={(v) => setLocation({ lat: v.lat, lng: v.lng })} />
          </label>

          <div className="actions">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? "Saving" : "Save profile"}
            </button>
            {/* Only offer Cancel once something has already been saved before -
                otherwise there's nothing to go "back" to. */}
            {profile?.address || profile?.operating_hours || profile?.ticket_info || profile?.location ? (
              <button type="button" className="btn btn-secondary" onClick={() => setMode("view")} disabled={saving}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      )}
    </div>
  );
}