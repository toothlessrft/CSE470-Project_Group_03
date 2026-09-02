import { Link } from "react-router-dom";

// items: [{ to, icon: LucideIconComponent, title, description, badge, onSelect }]
//
// `badge` renders an unread count as a red circle on the top-right corner of
// the card (used by the Admin Dashboard, which has no navbar bell), and
// `onSelect` fires when the card is clicked so the caller can clear it.
export default function ActionGrid({ items }) {
  return (
    <div className="action-grid">
      {items.map(({ to, icon: Icon, title, description, badge, onSelect }) => (
        <Link className="action-card" to={to} key={to} onClick={onSelect}>
          {badge > 0 && <span className="action-badge">{badge > 99 ? "99+" : badge}</span>}
          <div className="action-icon">
            <Icon size={22} strokeWidth={2} />
          </div>
          <div>
            <h4>{title}</h4>
            {description && <p>{description}</p>}
          </div>
        </Link>
      ))}
    </div>
  );
}
