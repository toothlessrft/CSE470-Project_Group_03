import { Star } from "lucide-react";

/*
  <StarRating value={3} onChange={setValue} />          interactive picker
  <StarRating value={4.3} readOnly count={12} />         "★ 4.3 (12)" display
*/
export default function StarRating({ value = 0, onChange, readOnly = false, count, size = 20 }) {
  const stars = [1, 2, 3, 4, 5];

  if (readOnly) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", whiteSpace: "nowrap" }}>
        <span style={{ display: "inline-flex" }}>
          {stars.map((n) => (
            <Star
              key={n}
              size={size}
              fill={n <= Math.round(value) ? "#c98a4b" : "none"}
              color="#c98a4b"
              strokeWidth={1.5}
            />
          ))}
        </span>
        <span style={{ fontSize: "0.85rem", color: "#8a7a68" }}>
          {value != null ? `${value.toFixed(1)}${count != null ? ` (${count})` : ""}` : "No ratings yet"}
        </span>
      </span>
    );
  }

  return (
    <span style={{ display: "inline-flex", gap: "0.25rem" }}>
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", lineHeight: 0 }}
        >
          <Star size={size} fill={n <= value ? "#c98a4b" : "none"} color="#c98a4b" strokeWidth={1.5} />
        </button>
      ))}
    </span>
  );
}
