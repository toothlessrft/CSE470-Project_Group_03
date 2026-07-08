import { Landmark, MapPin, FileText, Images } from "lucide-react";
import ActionGrid from "../../components/ActionGrid";

export default function PublicDashboard() {
  const actions = [
    {
      to: "/gallery",
      icon: Images,
      title: "Artifact Gallery",
      description: "Browse historical artifacts and discoveries. (Coming Soon)",
    },
    {
      to: "/heritage-sites",
      icon: Landmark,
      title: "Heritage Sites",
      description: "Explore famous heritage locations. (Coming Soon)",
    },
  ];

  return (
    <div className="page">
      <h1>General Public Dashboard</h1>

      <p className="page-subtitle">
        Welcome to ArchiveEARTH. Help preserve history by reporting newly
        discovered artifacts and exploring Bangladesh's cultural heritage.
      </p>

      <ActionGrid items={actions} />

      <div
        style={{
          marginTop: "40px",
          padding: "25px",
          borderRadius: "12px",
          background: "#fff",
        }}
      >
        <h2>Featured Artifacts</h2>

        <p style={{ color: "#777" }}>
          Artifact gallery will appear here in the next version.
        </p>
      </div>
    </div>
  );
}