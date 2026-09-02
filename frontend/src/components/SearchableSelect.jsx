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
    // Only update onChange if the value matches an option or is empty (for clearing)
    if (v === "") {
      onChange("");
    } else {
      // Find exact match (case-insensitive) and use the canonical option value
      const matchedOption = options.find((o) => o.toLowerCase() === v.toLowerCase());
      if (matchedOption) {
        onChange(matchedOption);
      }
    }
    setOpen(true);
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <input
        id={id}
        type="text"
        value={query}
        placeholder={placeholder}
        required={required}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        autoComplete="off"
        style={{
          width: "100%",
          padding: "0.8rem 0.9rem",
          minHeight: "52px",
          border: "1.5px solid #d8c7b1",
          borderRadius: "10px",
          fontSize: "1.02rem",
          fontFamily: "inherit",
          color: "#2b2118",
          background: "#f5f2ee",
          boxShadow: "inset 0 1px 1px rgba(43, 33, 24, 0.02)",
        }}
      />
      {open && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "calc(100% + 6px)",
            border: "1.5px solid #d8c7b1",
            borderRadius: "10px",
            maxHeight: "220px",
            overflowY: "auto",
            background: "#fff",
            zIndex: 20,
            boxShadow: "0 8px 24px rgba(43, 33, 24, 0.09)",
          }}
        >
          {filtered.length === 0 && (
            <div style={{ padding: "0.7rem 0.9rem", fontSize: "0.9rem", color: "#8a7a68" }}>No matches</div>
          )}
          {filtered.map((opt) => (
            <div
              key={opt}
              onMouseDown={(e) => {
                e.preventDefault();
                selectOption(opt);
              }}
              style={{
                padding: "0.7rem 0.9rem",
                cursor: "pointer",
                fontSize: "0.96rem",
                background: "transparent",
                borderBottom: "1px solid #f1e6d8",
              }}
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
