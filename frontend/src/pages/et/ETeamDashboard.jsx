// Ahad_23201016 - Excavation Team dashboard (replaces the Site Caretaker one).
// The account is a company; the profile shown is the company representative.
import { useEffect, useState } from "react";
import { FileSearch, ClipboardList, FolderKanban, Gavel, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import ProfileCard from "../../components/ProfileCard";
import ActionGrid from "../../components/ActionGrid";
import StarRating from "../../components/StarRating";

export default function ETeamDashboard() {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [stats, setStats] = useState(null);
  const [rating, setRating] = useState(null);

  useEffect(() => {
    api.get("/et/dashboard").then((data) => {
      setTeam(data.team);
      setStats(data.stats);
    });
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/reviews/history/${user.id}`).then((data) => setRating({ average: data.average, count: data.count }));
  }, [user?.id]);

  if (!team) return <div className="page">Loading...</div>;

  const actions = [
    {
      to: "/et/tenders",
      icon: FileSearch,
      title: "Browse Tenders",
      description: "Find open government excavation tenders and submit a bid",
    },
    {
      to: "/et/bids",
      icon: ClipboardList,
      title: "My Bids",
      description: "Track bid status, edit or withdraw before the deadline",
    },
    {
      to: "/et/projects",
      icon: FolderKanban,
      title: "Manage Projects",
      description: "Run your awarded excavations and log recovered artifacts",
    },
    {
      to: "/equipment",
      icon: Wrench,
      title: "Tools & Equipment",
      description: "Request excavation tools and field equipment for your assigned digs",
    },
    {
      to: "/auctions",
      icon: Gavel,
      title: "Auctions",
      description: "Bid on artifacts released for auction",
    },
  ];

  return (
    <div className="page">
      <h1>Excavation Team Dashboard</h1>
      <p className="page-subtitle">
        Bid on government excavation tenders and deliver the digs you win.
      </p>

      <ProfileCard
        name={team.company_name || team.name}
        nid={team.nid}
        email={team.email}
        role="Excavation Team"
        lines={[
          `Representative: ${team.name}${
            team.representative_designation ? ` (${team.representative_designation})` : ""
          }`,
          team.team_size != null && `Team size: ${team.team_size} members`,
          team.phone && `Phone: ${team.phone}`,
        ]}
        extra={
          rating && (
            <Link to={user?.id ? `/reviews/history/${user.id}` : "#"} style={{ textDecoration: "none", color: "inherit" }}>
              <StarRating value={rating.average} readOnly count={rating.count} size={16} />
            </Link>
          )
        }
      />

      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "1rem",
            marginTop: "1.25rem",
          }}
        >
          {[
            { label: "Open tenders", value: stats.open_tenders },
            { label: "Pending bids", value: stats.pending_bids },
            { label: "Active projects", value: stats.active_projects },
            { label: "Completed projects", value: stats.completed_projects },
          ].map((s) => (
            <div key={s.label} className="card" style={{ margin: 0, padding: "1rem 1.25rem" }}>
              <p className="hint" style={{ margin: 0 }}>{s.label}</p>
              <strong style={{ fontSize: "1.6rem", color: "var(--primary)" }}>{s.value}</strong>
            </div>
          ))}
        </div>
      )}

      <ActionGrid items={actions} />
    </div>
  );
}
