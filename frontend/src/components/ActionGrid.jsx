import { Link } from "react-router-dom";

// items: [{ to, icon, title, description, badge, onSelect }]
// `badge` draws a red count on the card corner; `onSelect` fires on click so
// the caller can clear it.
export default function ActionGrid({ items }) {
  return (
    <div className="action-grid">
      {items.map(({ to, icon: Icon, title, description, badge, onSelect }) => (
        <Link className="action-card" to={to} key={to} onClick={onSelect}>
          {badge > 0 && <span className="action-badge">{badge > 99 ? "99+" : badge}</span>}
          <span className="action-icon" aria-hidden="true">
            <Icon size={19} strokeWidth={2} />
          </span>
          <div>
            <h4>{title}</h4>
            {description && <p>{description}</p>}
          </div>
        </Link>
      ))}
    </div>
  );
}
