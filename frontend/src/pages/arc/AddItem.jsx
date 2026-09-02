import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api";

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
        specialization: buildSpecialization(),
      });
      setSuccess("Item added successfully!");
      setName("");
      setDescription("");
      setDiscoveryDate("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page narrow">
      <h1>Add Item {siteName && `- ${siteName}`}</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleSubmit} className="form">
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label>
          Discovery date
          <input type="date" value={discoveryDate} onChange={(e) => setDiscoveryDate(e.target.value)} required />
        </label>
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        {type === "Pottery" && (
          <fieldset>
            <legend>Pottery details</legend>
            <label>
              Utility
              <input value={utilityPottery} onChange={(e) => setUtilityPottery(e.target.value)} />
            </label>
            <label>
              Material type
              <input value={materialType} onChange={(e) => setMaterialType(e.target.value)} />
            </label>
          </fieldset>
        )}

        {type === "Metal_Object" && (
          <fieldset>
            <legend>Metal object details</legend>
            <label>
              Utility
              <input value={utilityMetal} onChange={(e) => setUtilityMetal(e.target.value)} />
            </label>
            <label>
              Alloy
              <input value={alloy} onChange={(e) => setAlloy(e.target.value)} />
            </label>
          </fieldset>
        )}

        {type === "Paintings" && (
          <fieldset>
            <legend>Painting details</legend>
            <label>
              Painter
              <input value={painter} onChange={(e) => setPainter(e.target.value)} />
            </label>
            <label>
              Canvas material
              <input value={canvasMaterial} onChange={(e) => setCanvasMaterial(e.target.value)} />
            </label>
            <label>
              Paint type
              <input value={paintType} onChange={(e) => setPaintType(e.target.value)} />
            </label>
          </fieldset>
        )}

        {type === "Human_Remains" && (
          <fieldset>
            <legend>Human remains details</legend>
            <label>
              Cause of death
              <input value={causeOfDeath} onChange={(e) => setCauseOfDeath(e.target.value)} />
            </label>
            <label>
              Gender
              <input value={gender} onChange={(e) => setGender(e.target.value)} />
            </label>
            <label>
              Ethnicity
              <input value={ethnicity} onChange={(e) => setEthnicity(e.target.value)} />
            </label>
            <label>
              Age
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
            </label>
            <label>
              Decay percentage
              <input type="number" value={decayPercentage} onChange={(e) => setDecayPercentage(e.target.value)} />
            </label>
            <label>
              Ornaments
              <input value={ornaments} onChange={(e) => setOrnaments(e.target.value)} />
            </label>
          </fieldset>
        )}

        <button type="submit" className="btn">
          Add Item
        </button>
      </form>
    </div>
  );
}
