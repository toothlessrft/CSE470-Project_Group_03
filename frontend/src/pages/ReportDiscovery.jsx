import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import GoogleMapPicker from "../components/GoogleMapPicker";
import ImageUploader from "../components/ImageUploader";

export default function ReportDiscovery() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [location, setLocation] = useState(null); // { lat, lng, address}
  const [material, setMaterial] = useState("");
  const [images, setImages] = useState([]);
  const [notes, setNotes] = useState("");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [contactPhone, setContactPhone] = useState(user?.phone || "");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!location) {
      setError("Mark the find location on the map before submitting.");
      return;
    }
    if (!contactEmail || !contactPhone) {
      setError("A contact email address and phone number are both required.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/reports", {
        lat: location.lat,
        lng: location.lng,
        address: location.address,
        material,
        images,
        notes,
        contact_email: contactEmail,
        contact_phone: contactPhone,
      });
      navigate("/my-reports", { state: { justSubmitted: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page narrow">
      <div className="page-head">
        <div>
          <span className="eyebrow">Discovery report</span>
          <h1>Report a find</h1>
          <p className="page-subtitle">
            Mark the exact spot and describe what you saw. The heritage authority will assign an
            archaeologist to inspect it.
          </p>
        </div>
      </div>

      <div className="alert alert-info">
        Leave the object where it lies. Its surrounding context carries most of its archaeological
        value, and removing it can make a site unreadable.
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <label>
          Find location
          <GoogleMapPicker value={location} onChange={setLocation} />
        </label>
        {location?.address && (
          <p className="hint" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <MapPin size={13} aria-hidden="true" /> {location.address}
          </p>
        )}

        <label>
          Material
          <input
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            placeholder="e.g. terracotta, bronze, stone, bone"
            required
          />
        </label>

        <label>
          Photographs
          <ImageUploader images={images} onChange={setImages} />
        </label>

        <label>
          Observations
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Depth, surrounding soil, what exposed it, and anything else nearby"
            rows={4}
          />
        </label>

        <fieldset>
          <legend>Contact details</legend>
          <label>
            Email address
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Phone number
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              autoComplete="tel"
              required
            />
          </label>
          <p className="hint" style={{ margin: 0 }}>
            The inspecting archaeologist may contact you to arrange a site visit.
          </p>
        </fieldset>

        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? "Submitting report" : "Submit report"}
        </button>
      </form>
    </div>
  );
}
