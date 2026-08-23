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
      // If nothing has ever been filled in, jump straight to editing so the
      // manager isn't stuck looking at an empty "preview".
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
      flashSuccess("Museum profile updated. This is what visitors will see.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="page">Loading museum profile...</div>;

  return (
    <div className="page">
      <h1>Museum Profile</h1>
      <p className="page-subtitle">
        {profile?.museum_name ? `Public-facing details for ${profile.museum_name}.` : "Public-facing details for your museum."}{" "}
        Shown on the Museum Directory and Near Me pages.
      </p>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {mode === "view" ? (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
            <h2 style={{ margin: 0 }}>{profile.museum_name}</h2>
            <button type="button" className="btn-small btn-outline-light" onClick={startEdit}>
              <Pencil size={14} /> Edit
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "1rem" }}>
            <p style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <MapPin size={16} />
              {profile.address || <span className="hint">No address set yet.</span>}
            </p>
            <p style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Clock size={16} />
              {profile.operating_hours || <span className="hint">No operating hours set yet.</span>}
            </p>
            <p style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Ticket size={16} />
              {profile.ticket_info || <span className="hint">No ticket info set yet.</span>}
            </p>
          </div>

          <div style={{ marginTop: "1.25rem" }}>
            {profile.location?.lat != null ? (
              <GoogleMapPicker value={profile.location} editable={false} />
            ) : (
              <p className="hint">No location pinned on the map yet — it won't appear on Near Me until you add one.</p>
            )}
          </div>
        </div>
      ) : (
        <form className="card form" onSubmit={handleSave}>
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
            Ticket info / link
            <input
              value={form.ticket_info}
              onChange={(e) => setForm((p) => ({ ...p, ticket_info: e.target.value }))}
              placeholder="e.g. ৳50 entry, or a link to buy tickets"
            />
          </label>

          <label>
            Location on map
            <GoogleMapPicker value={location} onChange={(v) => setLocation({ lat: v.lat, lng: v.lng })} />
          </label>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? "Saving..." : "Save museum profile"}
            </button>
            {/* Only offer Cancel once something has already been saved before -
                otherwise there's nothing to go "back" to. */}
            {profile?.address || profile?.operating_hours || profile?.ticket_info || profile?.location ? (
              <button type="button" className="btn-small btn-outline-light" onClick={() => setMode("view")} disabled={saving}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      )}
    </div>
  );
}