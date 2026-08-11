import { useEffect, useRef, useState } from "react";

export default function SearchableSelect({ options, value, onChange, placeholder, required, id }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((o) => o.toLowerCase().includes((query || "").toLowerCase()));

  function selectOption(opt) {
    setQuery(opt);
    onChange(opt);
    setOpen(false);
  }

  function handleInputChange(e) {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
    setOpen(true);
  }

  return (
    <div ref={wrapRef}>
      <input
        id={id}
        type="text"
        value={query}
        placeholder={placeholder}
        required={required}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && (
        <div
          style={{
            border: "1.5px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            marginTop: "6px",
            maxHeight: "200px",
            overflowY: "auto",
            background: "#fff",
          }}
        >
          {filtered.length === 0 && (
            <div style={{ padding: "0.55rem 0.8rem", fontSize: "0.88rem", color: "#8a7a68" }}>No matches</div>
          )}
          {filtered.map((opt) => (
            <div
              key={opt}
              onMouseDown={(e) => {
                e.preventDefault();
                selectOption(opt);
              }}
              style={{ padding: "0.55rem 0.8rem", cursor: "pointer", fontSize: "0.92rem" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f5efe6")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
