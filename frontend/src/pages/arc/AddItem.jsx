import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api";
import ArtifactImagePicker from "../../components/ArtifactImagePicker";

const TYPES = ["Pottery", "Metal_Object", "Paintings", "Human_Remains", "other"];

export default function AddItem() {
  const { projectId } = useParams();
  const [siteName, setSiteName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [discoveryDate, setDiscoveryDate] = useState("");
  const [type, setType] = useState("Pottery");
  const [picture, setPicture] = useState("");

  // specialization fields, kept flat and only the relevant subset is sent
  const [utilityPottery, setUtilityPottery] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [utilityMetal, setUtilityMetal] = useState("");
  const [alloy, setAlloy] = useState("");
  const [painter, setPainter] = useState("");
  const [canvasMaterial, setCanvasMaterial] = useState("");
  const [paintType, setPaintType] = useState("");
  const [causeOfDeath, setCauseOfDeath] = useState("");
  const [gender, setGender] = useState("");
  const [ethnicity, setEthnicity] = useState("");
  const [age, setAge] = useState("");
  const [decayPercentage, setDecayPercentage] = useState("");
  const [ornaments, setOrnaments] = useState("");

  useEffect(() => {
    api.get(`/arc/projects/${projectId}/items`).then((data) => setSiteName(data.site_name));
  }, [projectId]);

  function buildSpecialization() {
    switch (type) {
      case "Pottery":
        return { utility_pottery: utilityPottery, material_type: materialType };
      case "Metal_Object":
        return { utility_metal: utilityMetal, alloy };
      case "Paintings":
        return { painter, canvas_material: canvasMaterial, paint_type: paintType };
      case "Human_Remains":
        return {
          cause_of_death: causeOfDeath,
          gender,
          ethnicity,
          age: age ? Number(age) : undefined,
          decay_percentage: decayPercentage ? Number(decayPercentage) : undefined,
          ornaments,
        };
      default:
        return {};
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.post(`/arc/projects/${projectId}/items`, {
        name,
        description,
        discovery_date: discoveryDate,
        Type: type,
        picture,
        specialization: buildSpecialization(),
      });
      setSuccess("Artifact added to the project catalogue.");
      setName("");
      setDescription("");
      setDiscoveryDate("");
      setPicture("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page narrow">
      <div className="page-head">
        <div>
          <span className="eyebrow">{siteName || "Excavation project"}</span>
          <h1>Catalogue an artifact</h1>
          <p className="page-subtitle">
            Record a recovered object against this project. Class-specific fields appear once
            you choose an object class.
          </p>
        </div>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleSubmit} className="form">
        <label>
          Artifact name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Grey ware storage jar"
            required
          />
        </label>
        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Condition, dimensions, decoration, and the context it came from"
          />
        </label>
        <label>
          Date recovered
          <input type="date" value={discoveryDate} onChange={(e) => setDiscoveryDate(e.target.value)} required />
        </label>
        <label>
          Object class
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <ArtifactImagePicker value={picture} onChange={setPicture} />

        {type === "Pottery" && (
          <fieldset>
            <legend>Pottery details</legend>
            <div className="form-row">
              <label>
                Vessel function
                <input value={utilityPottery} onChange={(e) => setUtilityPottery(e.target.value)} />
              </label>
              <label>
                Fabric
                <input value={materialType} onChange={(e) => setMaterialType(e.target.value)} />
              </label>
            </div>
          </fieldset>
        )}

        {type === "Metal_Object" && (
          <fieldset>
            <legend>Metalwork details</legend>
            <div className="form-row">
              <label>
                Function
                <input value={utilityMetal} onChange={(e) => setUtilityMetal(e.target.value)} />
              </label>
              <label>
                Alloy
                <input value={alloy} onChange={(e) => setAlloy(e.target.value)} />
              </label>
            </div>
          </fieldset>
        )}

        {type === "Paintings" && (
          <fieldset>
            <legend>Painting details</legend>
            <label>
              Attributed artist
              <input value={painter} onChange={(e) => setPainter(e.target.value)} />
            </label>
            <div className="form-row">
              <label>
                Support material
                <input value={canvasMaterial} onChange={(e) => setCanvasMaterial(e.target.value)} />
              </label>
              <label>
                Pigment or medium
                <input value={paintType} onChange={(e) => setPaintType(e.target.value)} />
              </label>
            </div>
          </fieldset>
        )}

        {type === "Human_Remains" && (
          <fieldset>
            <legend>Osteological details</legend>
            <p className="hint" style={{ margin: 0 }}>
              Record only what the assessment supports. Leave a field blank where the evidence is
              inconclusive.
            </p>
            <label>
              Probable cause of death
              <input value={causeOfDeath} onChange={(e) => setCauseOfDeath(e.target.value)} />
            </label>
            <div className="form-row">
              <label>
                Estimated sex
                <input value={gender} onChange={(e) => setGender(e.target.value)} />
              </label>
              <label>
                Population affinity
                <input value={ethnicity} onChange={(e) => setEthnicity(e.target.value)} />
              </label>
              <label>
                Estimated age at death
                <input type="number" min="0" value={age} onChange={(e) => setAge(e.target.value)} />
              </label>
              <label>
                Degradation (%)
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={decayPercentage}
                  onChange={(e) => setDecayPercentage(e.target.value)}
                />
              </label>
            </div>
            <label>
              Associated grave goods
              <input value={ornaments} onChange={(e) => setOrnaments(e.target.value)} />
            </label>
          </fieldset>
        )}

        <button type="submit" className="btn">
          Add to catalogue
        </button>
      </form>
    </div>
  );
}
