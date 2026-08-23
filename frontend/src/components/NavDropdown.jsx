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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="nav-dropdown" ref={rootRef}>
      <button type="button" className="nav-dropdown-trigger" onClick={() => setOpen((o) => !o)}>
        {Icon && <Icon size={15} />} {label} <ChevronDown size={13} style={{ opacity: 0.8 }} />
      </button>
      {open && (
        <div className="nav-dropdown-menu">
          {items.map(({ to, icon: ItemIcon, label: itemLabel }) => (
            <Link key={to} to={to} onClick={() => setOpen(false)}>
              {ItemIcon && <ItemIcon size={15} />} {itemLabel}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}