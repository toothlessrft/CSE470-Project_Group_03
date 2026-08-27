import { useEffect, useState } from "react";
import { FolderKanban, ClipboardList, Gavel, Wrench, HelpCircle } from "lucide-react";
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

  if (!archaeologist) return <div className="page">Loading...</div>;

  const actions = [
    { to: "/arc/projects", icon: FolderKanban, title: "Manage Projects", description: "Excavation team, artifacts, and tools for your active digs" },
    { to: "/arc/assignments", icon: ClipboardList, title: "Field Inspections & Reports", description: "Verify assigned discoveries and compile researcher reports" },
    { to: "/equipment", icon: Wrench, title: "Tools & Equipment", description: "Request excavation tools and field equipment for your active digs" },
    { to: "/auctions", icon: Gavel, title: "Auctions", description: "Bid on artifacts released for auction" },
    { to: "/qna", icon: HelpCircle, title: "Public Archaeology Q&A", description: "Answer public questions and manage your posted answers" },
  ];

  return (
    <div className="page">
      <h1>Archaeologist Dashboard</h1>
      <p className="page-subtitle">Manage your excavation projects, teams, and field assignments.</p>

      <ProfileCard
        name={archaeologist.name}
        nid={archaeologist.nid}
        email={archaeologist.email}
        role="Archaeologist / Researcher"
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

      <ActionGrid items={actions} />
    </div>
  );
}