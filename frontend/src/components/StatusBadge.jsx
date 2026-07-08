const COLORS = {
  Pending: "#b5834d",
  Assigned: "#2563eb",
  Verified: "#2e7d32",
  Rejected: "#c62828",
};

export default function StatusBadge({ status }) {
  const color = COLORS[status] || "#6b6258";
  return (
    <span className="status-badge" style={{ backgroundColor: color }}>
      {status}
    </span>
  );
}
