import { useEffect, useState } from "react";
import { api } from "../../api";
import SearchableSelect from "../../components/SearchableSelect";
import { MUSEUMS } from "../../data/museums";

export default function RequestLoan() {
  const [museumManagers, setMuseumManagers] = useState([]);
  const [items, setItems] = useState([]);

  const [selectedMuseumName, setSelectedMuseumName] = useState("");
  const [lendingMuseumId, setLendingMuseumId] = useState("");
  const [itemId, setItemId] = useState("");
  const [selectedItemLabel, setSelectedItemLabel] = useState("");
  const [exhibitionName, setExhibitionName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.get("/loans/museums").then((data) => setMuseumManagers(data.museums));
  }, []);

  useEffect(() => {
    if (!selectedMuseumName) {
      setItems([]);
      setItemId("");
      setSelectedItemLabel("");
      setLendingMuseumId("");
      return;
    }

    const matchingManager = museumManagers.find(
      (m) => (m.roleProfile?.museum_name || m.name) === selectedMuseumName
    );
    setLendingMuseumId(matchingManager?._id || "");

    api
      .get(`/loans/items?museumName=${encodeURIComponent(selectedMuseumName)}`)
      .then((data) => {
        setItems(data.items || []);
        setItemId("");
        setSelectedItemLabel("");
      })
      .catch(() => {
        setItems([]);
        setItemId("");
        setSelectedItemLabel("");
      });
  }, [selectedMuseumName, museumManagers]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!lendingMuseumId) {
      setError("Please choose a museum that has an approved museum authority in the system.");
      return;
    }

    try {
      await api.post("/loans/request", {
        lending_museum_id: lendingMuseumId,
        item_id: itemId,
        exhibition_name: exhibitionName,
        purpose,
        start_date: startDate,
        end_date: endDate,
      });
      setSuccess("Loan request sent successfully!");
      setSelectedMuseumName("");
      setLendingMuseumId("");
      setItemId("");
      setSelectedItemLabel("");
      setExhibitionName("");
      setPurpose("");
      setStartDate("");
      setEndDate("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page narrow">
      <h1>Request Artifact Loan</h1>
      <p className="page-subtitle">Ask another museum authority to loan an artifact for your exhibition.</p>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleSubmit} className="form">
        <label>
          Lend from (museum)
          <SearchableSelect
            options={MUSEUMS}
            value={selectedMuseumName}
            onChange={(value) => setSelectedMuseumName(value)}
            placeholder="Search museum name"
            required
          />
        </label>

        <label>
          Artifact
          <SearchableSelect
            options={items.map((i) => `${i.name} (${i.Type})${i.site?.name ? ` - ${i.site.name}` : ""}`)}
            value={selectedItemLabel}
            onChange={(value) => {
              const match = items.find((i) => `${i.name} (${i.Type})${i.site?.name ? ` - ${i.site.name}` : ""}` === value);
              setSelectedItemLabel(value);
              setItemId(match?._id || "");
            }}
            placeholder={selectedMuseumName ? "Search artifact" : "Choose a museum first"}
            required={!!selectedMuseumName}
          />
        </label>

        <label>
          Exhibition name
          <input
            type="text"
            value={exhibitionName}
            onChange={(e) => setExhibitionName(e.target.value)}
            placeholder="e.g. Bronze Age Treasures"
            required
          />
        </label>

        <label>
          Purpose
          <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
        </label>

        <label>
          Loan start date
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </label>
        <label>
          Loan end date
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </label>

        <button type="submit" className="btn">
          Send Loan Request
        </button>
      </form>
    </div>
  );
}
