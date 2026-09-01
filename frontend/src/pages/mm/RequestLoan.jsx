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
      setError("Choose a museum with an approved authority account on the register.");
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
      setSuccess("Loan request sent to the lending museum.");
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
      <div className="page-head">
        <div>
          <span className="eyebrow">Inter-museum loan</span>
          <h1>Request a loan</h1>
          <p className="page-subtitle">
            Ask another museum to lend an artifact from its collection for one of your exhibitions.
          </p>
        </div>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleSubmit} className="form">
        <label>
          Lending museum
          <SearchableSelect
            options={MUSEUMS}
            value={selectedMuseumName}
            onChange={(value) => setSelectedMuseumName(value)}
            placeholder="Search by museum name"
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
            placeholder={selectedMuseumName ? "Search their holdings" : "Choose a lending museum first"}
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
          Purpose of the loan
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="How the artifact will be displayed, interpreted, and cared for"
            required
          />
        </label>

        <div className="form-row">
          <label>
            Loan begins
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </label>
          <label>
            Return by
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </label>
        </div>

        <button type="submit" className="btn">
          Send loan request
        </button>
      </form>
    </div>
  );
}
