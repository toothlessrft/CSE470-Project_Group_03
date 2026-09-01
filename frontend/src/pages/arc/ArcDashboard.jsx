import { useEffect, useState } from "react";
import { FolderKanban, ClipboardList, Gavel, Wrench, MessagesSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import ProfileCard from "../../components/ProfileCard";
import ActionGrid from "../../components/ActionGrid";
import StarRating from "../../components/StarRating";

export default function ArcDashboard() {
  const { user } = useAuth();
  const [archaeologist, setArchaeologist] = useState(null);
  const [rating, setRating] = useState(null);

  useEffect(() => {
    api.get("/arc/dashboard").then((data) => setArchaeologist(data.archaeologist));
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/reviews/history/${user.id}`).then((data) => setRating({ average: data.average, count: data.count }));
  }, [user?.id]);

  if (!archaeologist)
    return (
      <div className="page">
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" /> Loading your workspace
        </div>
      </div>
    );

  const actions = [
    { to: "/arc/projects", icon: FolderKanban, title: "Excavation projects", description: "Field team, recovered artifacts, and equipment for each active dig" },
    { to: "/arc/assignments", icon: ClipboardList, title: "Inspections & reports", description: "Verify assigned discoveries and compile researcher reports" },
    { to: "/equipment", icon: Wrench, title: "Field equipment", description: "Request tools and instruments for your active excavations" },
    { to: "/auctions", icon: Gavel, title: "Artifact auctions", description: "Bid on lots released for lawful sale" },
    { to: "/qna", icon: MessagesSquare, title: "Public questions", description: "Answer questions from the public and manage your published answers" },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Archaeologist</span>
          <h1>Research workspace</h1>
          <p className="page-subtitle">
            Your excavation projects, field teams, inspection assignments, and equipment.
          </p>
        </div>
      </div>

      <ProfileCard
        name={archaeologist.name}
        nid={archaeologist.nid}
        email={archaeologist.email}
        role="Archaeologist"
        lines={[
          archaeologist.affiliation && `Affiliation: ${archaeologist.affiliation}`,
          archaeologist.biography,
        ]}
        extra={
          rating && (
            <Link to={user?.id ? `/reviews/history/${user.id}` : "#"} style={{ textDecoration: "none", color: "inherit" }}>
              <StarRating value={rating.average} readOnly count={rating.count} size={16} />
            </Link>
          )
        }
      />

      <div className="section-head">
        <h2>Project management</h2>
      </div>
      <ActionGrid items={actions} />
    </div>
  );
}