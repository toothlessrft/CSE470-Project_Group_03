import { Star } from "lucide-react";

/*
  <StarRating value={3} onChange={setValue} />          interactive picker
  <StarRating value={4.3} readOnly count={12} />         "4.3 - 12 reviews" display
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
              color="var(--accent)"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          ))}
        </span>
        <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
          {value != null
            ? `${value.toFixed(1)}${count != null ? ` · ${count} review${count === 1 ? "" : "s"}` : ""}`
            : "Not yet rated"}
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
          aria-label={`Rate ${n} out of 5`}
          aria-pressed={n <= value}
          style={{ background: "none", border: "none", padding: "2px", cursor: "pointer", lineHeight: 0 }}
        >
          <Star
            size={size}
            fill={n <= value ? "var(--accent)" : "none"}
            color="var(--accent)"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </button>
      ))}
    </span>
  );
}
