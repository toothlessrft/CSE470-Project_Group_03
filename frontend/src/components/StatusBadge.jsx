const COLORS = {
  Pending: "#b5834d",
  Assigned: "#2563eb",
  Verified: "#2e7d32",
  Rejected: "#c62828",
  Approved: "#2e7d32",
  Active: "#2563eb",
  Sold: "#2e7d32",
  Unsold: "#6b6258",
  Cancelled: "#c62828",
  Secured: "#2e7d32",
  "Not Secured": "#c62828",
};

export default function StatusBadge({ status }) {
  const color = COLORS[status] || "#6b6258";
  return (
    <span className="status-badge" style={{ backgroundColor: color }}>
      {status}
    </span>
  );
}
