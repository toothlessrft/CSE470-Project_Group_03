import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

// label/icon: the trigger button's content.
// items: [{ to, icon, label }] rendered as links inside the dropdown panel.
export default function NavDropdown({ label, icon: Icon, items }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="nav-dropdown" ref={rootRef}>
      <button
        type="button"
        className="nav-dropdown-trigger"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
      >
        {Icon && <Icon size={15} aria-hidden="true" />} {label}
        <ChevronDown
          size={13}
          aria-hidden="true"
          style={{ opacity: 0.7, transform: open ? "rotate(180deg)" : "none", transition: "transform 120ms ease" }}
        />
      </button>
      {open && (
        <div className="nav-dropdown-menu">
          {items.map(({ to, icon: ItemIcon, label: itemLabel }) => (
            <Link key={to} to={to} onClick={() => setOpen(false)}>
              {ItemIcon && <ItemIcon size={15} aria-hidden="true" />} {itemLabel}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
