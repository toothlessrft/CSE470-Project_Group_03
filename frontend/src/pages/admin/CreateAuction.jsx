import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import SearchableSelect from "../../components/SearchableSelect";

const DURATION_PRESETS = [
  { label: "2 hours", ms: 2 * 60 * 60 * 1000 },
  { label: "1 day", ms: 24 * 60 * 60 * 1000 },
  { label: "3 days", ms: 3 * 24 * 60 * 60 * 1000 },
  { label: "7 days", ms: 7 * 24 * 60 * 60 * 1000 },
];

function toLocalDatetimeInput(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CreateAuction() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState([]);
  const [itemLabel, setItemLabel] = useState("");
  const [itemId, setItemId] = useState("");
  const [startingBid, setStartingBid] = useState("");
  const [minIncrement, setMinIncrement] = useState("");
  const [deadline, setDeadline] = useState("");
  const [sourcePercentage, setSourcePercentage] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [extendTrigger, setExtendTrigger] = useState(2);
  const [extendBy, setExtendBy] = useState(2);
  const [bidCount, setBidCount] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/auctions/admin/candidates").then((data) => setCandidates(data.items));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/auctions/${id}`).then((data) => {
      const a = data.auction;
      setItemId(a.item?._id || "");
      setItemLabel(a.item?.name || "");
      setStartingBid(a.starting_bid);
      setMinIncrement(a.min_increment);
      setDeadline(toLocalDatetimeInput(a.deadline));
      setSourcePercentage(a.source_percentage ?? "");
      setSourceName(a.source_name || "");
      setExtendTrigger(a.extend_trigger_minutes);
      setExtendBy(a.extend_by_minutes);
      setBidCount(a.bid_count);
    });
  }, [id, isEdit]);

  const itemOptions = candidates.map((c) => `${c.name} (${c.Type}${c.allocation === "Auction" ? " - marked for auction" : ""})`);
  const itemByLabel = Object.fromEntries(
    candidates.map((c) => [`${c.name} (${c.Type}${c.allocation === "Auction" ? " - marked for auction" : ""})`, c._id])
  );

  function pickDuration(ms) {
    setDeadline(toLocalDatetimeInput(new Date(Date.now() + ms)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const resolvedItemId = itemByLabel[itemLabel] || itemId;
    if (!resolvedItemId && !isEdit) {
      setError("Please select an artifact.");
      return;
    }
    if (!deadline) {
      setError("Please set a deadline.");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        item: resolvedItemId,
        starting_bid: startingBid,
        min_increment: minIncrement,
        deadline: new Date(deadline).toISOString(),
        source_percentage: sourcePercentage,
        source_name: sourceName,
        extend_trigger_minutes: extendTrigger,
        extend_by_minutes: extendBy,
      };
      if (isEdit) {
        await api.put(`/auctions/${id}`, payload);
      } else {
        await api.post("/auctions", payload);
      }
      navigate("/admin/auctions");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const gridTwo = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" };

  return (
    <div className="page narrow">
      <h1>{isEdit ? "Edit Auction" : "Create New Auction"}</h1>
      <p className="page-subtitle">
        {isEdit ? "Update this auction's rules." : "Put an artifact up for auction and set the bidding rules."}
      </p>
      {error && <div className="alert alert-danger">{error}</div>}
      {isEdit && bidCount > 0 && (
        <div className="alert alert-success">
          This auction already has {bidCount} bid(s). To keep things fair, the artifact, starting bid, and minimum
          increment are locked - you can still extend the deadline or change the source payout.
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
        <label>
          Select Artifact
          {isEdit ? (
            <input value={itemLabel} disabled />
          ) : (
            <SearchableSelect
              options={itemOptions}
              value={itemLabel}
              onChange={setItemLabel}
              placeholder="Type to search artifacts..."
              required
            />
          )}
        </label>

        <div style={gridTwo}>
          <label>
            Starting Bid Price (৳)
            <input
              type="number"
              min="0"
              required
              disabled={isEdit && bidCount > 0}
              value={startingBid}
              onChange={(e) => setStartingBid(e.target.value)}
            />
          </label>

          <label>
            Minimum Bid Increment (৳)
            <input
              type="number"
              min="1"
              required
              disabled={isEdit && bidCount > 0}
              value={minIncrement}
              onChange={(e) => setMinIncrement(e.target.value)}
            />
          </label>
        </div>

        <label>
          Auction Deadline
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", margin: "0.15rem 0 0.6rem" }}>
            {DURATION_PRESETS.map((p) => (
              <button key={p.label} type="button" className="btn-small" onClick={() => pickDuration(p.ms)}>
                {p.label}
              </button>
            ))}
          </div>
          <input type="datetime-local" required value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </label>

        <fieldset>
          <legend>Auto-deadline Extension</legend>
          <p className="hint" style={{ margin: "0 0 0.9rem" }}>
            If a bid lands within the trigger window before the deadline, the deadline pushes back automatically.
          </p>
          <div style={gridTwo}>
            <label>
              Trigger window (minutes)
              <input type="number" min="0" value={extendTrigger} onChange={(e) => setExtendTrigger(e.target.value)} />
            </label>
            <label>
              Extend by (minutes)
              <input type="number" min="0" value={extendBy} onChange={(e) => setExtendBy(e.target.value)} />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Optional</legend>
          <div style={gridTwo}>
            <label>
              Source Payout (%)
              <input type="number" min="0" max="100" value={sourcePercentage} onChange={(e) => setSourcePercentage(e.target.value)} placeholder="e.g. 10" />
            </label>
            <label>
              Source Name
              <input value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="e.g. Rahim Khan (reporter)" />
            </label>
          </div>
        </fieldset>

        <button type="submit" className="btn" disabled={busy}>
          {busy ? "Saving..." : isEdit ? "Save Changes" : "Create Auction"}
        </button>
      </form>
    </div>
  );
}
