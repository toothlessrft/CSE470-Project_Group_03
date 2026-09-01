// Ahad_23201016 - Excavation Team dashboard (replaces the Site Caretaker one).
// The account is a company; the profile shown is the company representative.
import { useEffect, useState } from "react";
import { FileSearch, ClipboardList, FolderKanban, Gavel } from "lucide-react";
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

  if (!team)
    return (
      <div className="page">
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading your workspace
        </div>
      </div>
    );

  const actions = [
    {
      to: "/et/tenders",
      icon: FileSearch,
      title: "Open tenders",
      description: "Review published excavation tenders and submit a bid",
    },
    {
      to: "/et/bids",
      icon: ClipboardList,
      title: "Submitted bids",
      description: "Track outcomes, and revise or withdraw before the closing date",
    },
    {
      to: "/et/projects",
      icon: FolderKanban,
      title: "Awarded projects",
      description: "Run the excavations you hold and log every recovered artifact",
    },
    {
      to: "/auctions",
      icon: Gavel,
      title: "Artifact auctions",
      description: "Bid on lots released for lawful sale",
    },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Excavation Contractor</span>
          <h1>Contract workspace</h1>
          <p className="page-subtitle">
            Bid for government excavation tenders and deliver the contracts you are awarded.
          </p>
        </div>
      </div>

      <ProfileCard
        name={team.company_name || team.name}
        nid={team.nid}
        email={team.email}
        role="Excavation Contractor"
        lines={[
          `Representative: ${team.name}${
            team.representative_designation ? ` (${team.representative_designation})` : ""
          }`,
          team.team_size != null && `Field crew: ${team.team_size} members`,
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
        <div className="stat-row">
          {[
            { label: "Open tenders", value: stats.open_tenders },
            { label: "Bids pending", value: stats.pending_bids },
            { label: "Active projects", value: stats.active_projects },
            { label: "Completed", value: stats.completed_projects },
          ].map((s) => (
            <div key={s.label} className="stat">
              <span className="stat-label">{s.label}</span>
              <span className="stat-value">{s.value}</span>
            </div>
          ))}
        </div>
      )}

      <div className="section-head">
        <h2>Contract management</h2>
      </div>
      <ActionGrid items={actions} />
    </div>
  );
}
