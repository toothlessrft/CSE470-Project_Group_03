import { Link } from "react-router-dom";

// items: [{ to, icon: LucideIconComponent, title, description }]
export default function ActionGrid({ items }) {
  return (
    <div className="action-grid">
      {items.map(({ to, icon: Icon, title, description }) => (
        <Link className="action-card" to={to} key={to}>
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