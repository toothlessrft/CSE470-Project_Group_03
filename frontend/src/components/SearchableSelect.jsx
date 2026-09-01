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
        className="input"
      />
      {open && (
        <div className="select-menu">
          {filtered.length === 0 && (
            <div className="select-empty">No matching entry</div>
          )}
          {filtered.map((opt) => (
            <div
              key={opt}
              onMouseDown={(e) => {
                e.preventDefault();
                selectOption(opt);
              }}
              className="select-option"
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
