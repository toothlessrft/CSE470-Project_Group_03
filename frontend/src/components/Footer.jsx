import { Link } from "react-router-dom";
import BrandMark from "./BrandMark";

const COLUMNS = [
  {
    heading: "Explore",
    links: [
      { to: "/search", label: "Artifact catalogue" },
      { to: "/knowledge", label: "Knowledge hub" },
      { to: "/museums", label: "Museum directory" },
      { to: "/near-me", label: "Sites near you" },
    ],
  },
  {
    heading: "Participate",
    links: [
      { to: "/report-discovery", label: "Report a find" },
      { to: "/qna", label: "Ask an archaeologist" },
      { to: "/auctions", label: "Artifact auctions" },
      { to: "/exhibitions", label: "Exhibitions & events" },
    ],
  },
  {
    heading: "Account",
    links: [
      { to: "/login", label: "Sign in" },
      { to: "/register", label: "Register" },
      { to: "/my-reports", label: "My submissions" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <span className="site-footer-brand">
            <BrandMark /> ArchiveEarth
          </span>
          <p className="site-footer-note">
            The national register of archaeological sites, excavations, and recovered artifacts.
            Maintained with the Department of Archaeology, participating museums, and licensed
            excavation contractors.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <h4>{col.heading}</h4>
            <ul>
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="site-footer-base">
        <span>© {new Date().getFullYear()} ArchiveEarth · Heritage Registry</span>
        <span>Report suspected looting or illicit trade to your local heritage authority.</span>
      </div>
    </footer>
  );
}
