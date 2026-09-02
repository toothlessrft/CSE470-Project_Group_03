// Status pill: a colour dot plus the label, so state is never carried by
// colour alone. Each entry is the foreground colour everything inherits.
const COLORS = {
  Pending: "#8a5a12",
  Assigned: "#1d4ed8",
  Verified: "#1f6b2e",
  Rejected: "#b02020",
  Approved: "#1f6b2e",
  Active: "#1d4ed8",
  Sold: "#1f6b2e",
  Unsold: "#6f6254",
  Cancelled: "#b02020",
  Secured: "#1f6b2e",
  "Not Secured": "#b02020",
  "On Display": "#1f6b2e",
  "In Storage": "#6f6254",
  "On Loan": "#8a5a12",
  "Under Conservation": "#a56200",
  Transferred: "#4a5b7d",
  Answered: "#1f6b2e",
  Open: "#6f6254",
};

// Very light wash behind the pill, derived from the same hue.
const TINTS = {
  "#8a5a12": "#fdf4e3",
  "#1d4ed8": "#eef3fd",
  "#1f6b2e": "#eef9f0",
  "#b02020": "#fdeeee",
  "#6f6254": "#f7f3ec",
  "#a56200": "#fdf4e3",
  "#4a5b7d": "#eff2f7",
};

export default function StatusBadge({ status }) {
  const color = COLORS[status] || "#6f6254";
  return (
    <span
      className="status-badge"
      style={{ color, backgroundColor: TINTS[color] || "#f7f3ec" }}
    >
      {status}
    </span>
  );
}