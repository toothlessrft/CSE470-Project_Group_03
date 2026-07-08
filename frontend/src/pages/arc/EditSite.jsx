import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api";

export default function EditSite() {
  const { projectId } = useParams();
  const [site, setSite] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [description, setDescription] = useState("");
  const [era, setEra] = useState("");
  const [sThana, setSThana] = useState("");
  const [sDistrict, setSDistrict] = useState("");
  const [sStreet, setSStreet] = useState("");
  const [architecture, setArchitecture] = useState("");

  function load() {
    api.get(`/arc/projects/${projectId}/site`).then((data) => {
      setSite(data.site);
      setDescription(data.site.description || "");
      setEra(data.site.era || "");
      setSThana(data.site.s_thana || "");
      setSDistrict(data.site.s_district || "");
      setSStreet(data.site.s_street || "");
      setArchitecture(data.site.architecture || "");
    });
  }

  useEffect(load, [projectId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const data = await api.patch(`/arc/projects/${projectId}/site`, {
        description,
        era,
        s_thana: sThana,
        s_district: sDistrict,
        s_street: sStreet,
        architecture,
      });
      setSite(data.site);
      setSuccess("Site updated.");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!site) return <div className="page">Loading...</div>;

  return (
    <div className="page narrow">
      <h1>Edit Site - {site.name}</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleSubmit} className="form">
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label>
          Era
          <input value={era} onChange={(e) => setEra(e.target.value)} />
        </label>
        <label>
          Thana
          <input value={sThana} onChange={(e) => setSThana(e.target.value)} />
        </label>
        <label>
          District
          <input value={sDistrict} onChange={(e) => setSDistrict(e.target.value)} />
        </label>
        <label>
          Street
          <input value={sStreet} onChange={(e) => setSStreet(e.target.value)} />
        </label>
        <label>
          Architecture
          <textarea value={architecture} onChange={(e) => setArchitecture(e.target.value)} />
        </label>
        <button type="submit" className="btn">
          Save Changes
        </button>
      </form>
    </div>
  );
}
