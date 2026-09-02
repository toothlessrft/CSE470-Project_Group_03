function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function ProfileCard({ name, nid, email, role, lines = [] }) {
  return (
    <div className="profile-card">
      <div className="profile-avatar">{initials(name)}</div>
      <div className="profile-body">
        <div className="profile-name-row">
          <h2>{name}</h2>
          {nid && <span className="profile-nid">{nid}</span>}
        </div>
        {role && <span className="profile-role">{role}</span>}
        {email && <p className="profile-email">{email}</p>}
        {lines.filter(Boolean).map((line, i) => (
          <p key={i} className="profile-line">{line}</p>
        ))}
      </div>
    </div>
  );
}