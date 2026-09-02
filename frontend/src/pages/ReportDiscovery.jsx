import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
      setError("Please select the discovery location on the map.");
      return;
    }
    if (!contactEmail || !contactPhone) {
      setError("Contact email and phone number are both required.");
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
      <h1>Report a Discovery</h1>
      <p className="hint">
        Found a possible artifact? Pin the exact spot on the map and share what you saw — a Government/Admin
        reviewer will assign a researcher to inspect it.
      </p>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <label>
          Location
          <GoogleMapPicker value={location} onChange={setLocation} />
        </label>
        {location?.address && <p className="hint">📍 {location.address}</p>}

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
          Photos
          <ImageUploader images={images} onChange={setImages} />
        </label>

        <label>
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything else worth mentioning: depth, surrounding context, how it was found..."
            rows={4}
          />
        </label>

        <fieldset>
          <legend>Contact info</legend>
          <label>
            Email
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Phone number
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              required
            />
          </label>
        </fieldset>

        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </div>
  );
}
