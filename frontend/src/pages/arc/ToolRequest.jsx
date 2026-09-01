import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api";

export default function ToolRequest() {
  const { projectId } = useParams();
  const [tools, setTools] = useState([]);
  const [toolId, setToolId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/arc/tools").then((data) => setTools(data.tools));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post(`/arc/projects/${projectId}/tools`, {
        tool_id: toolId,
        start_date: startDate,
        end_date: endDate,
        purpose,
      });
      navigate("/arc/projects");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page narrow">
      <div className="page-head">
        <div>
          <span className="eyebrow">Field equipment</span>
          <h1>Equipment request</h1>
          <p className="page-subtitle">
            Reserve an instrument from the national equipment pool for a defined period.
          </p>
        </div>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit} className="form">
        <label>
          Equipment
          <select value={toolId} onChange={(e) => setToolId(e.target.value)} required>
            <option value="">Choose an item</option>
            {tools.map((t) => (
              <option key={t._id} value={t._id}>
                {t.model_no} - {t.type} ({t.owner})
              </option>
            ))}
          </select>
        </label>
        <div className="form-row">
          <label>
            Required from
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </label>
          <label>
            Return by
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </label>
        </div>
        <label>
          Intended use
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="What the equipment is needed for and where it will be used"
            required
          />
        </label>
        <button type="submit" className="btn">
          Submit request
        </button>
      </form>
    </div>
  );
}
