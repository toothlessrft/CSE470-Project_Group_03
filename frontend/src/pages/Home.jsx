import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Landmark,
  Search,
  LayoutDashboard,
  CalendarDays,
  ArrowRight,
  Gavel,
  LocateFixed,
  MessagesSquare,
  BookOpen,
  Gem,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ROLE_HOME } from "../context/AuthContext";
import { api } from "../api";
import StrataGraphic from "../components/StrataGraphic";

// The public entry points, presented as a numbered index rather than a wall
// of cards.
const INDEX = [
  { to: "/search", num: "01", icon: Search, title: "Artifact catalogue", desc: "Filter the national record by civilization, era, region, material, or use." },
  { to: "/museums", num: "02", icon: Landmark, title: "Museum directory", desc: "Every participating museum, with what is on display, in storage, or on loan." },
  { to: "/exhibitions", num: "03", icon: CalendarDays, title: "Exhibitions & events", desc: "Public exhibitions, educational tours, and cultural programmes." },
  { to: "/near-me", num: "04", icon: LocateFixed, title: "Sites near you", desc: "Recorded excavation sites, museums, and events within reach." },
  { to: "/auctions", num: "05", icon: Gavel, title: "Artifact auctions", desc: "Lots released for lawful sale, with bidding history and outcomes." },
  { to: "/qna", num: "06", icon: MessagesSquare, title: "Ask an archaeologist", desc: "Put a question to working researchers and read what they answered before." },
];

// What actually happens to a reported find. Useful, and specific to this site.
const PROCESS = [
  { n: "1", title: "A find is reported", body: "Anyone can log a surfaced artifact with photographs and a map location." },
  { n: "2", title: "An inspection is assigned", body: "The heritage authority routes the report to an archaeologist for verification." },
  { n: "3", title: "The site is excavated", body: "Licensed contractors win the tender and recover the context around the find." },
  { n: "4", title: "The record goes public", body: "Verified artifacts are catalogued, allocated to a museum, and published here." },
];

const SUGGESTED = ["Terracotta", "Pala", "Mahasthangarh", "Bronze", "Burial"];

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exhibitions, setExhibitions] = useState([]);
  const [finds, setFinds] = useState([]);
  const [figures, setFigures] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api
      .get("/exhibitions?upcoming=true&limit=24")
      .then((data) => setExhibitions(data.exhibitions || []))
      .catch(() => setExhibitions([]));

    // One request covers both the recent-finds strip and the artifact figure.
    api
      .get("/search/artifacts")
      .then((data) => {
        const results = data.results || [];
        const illustrated = results.filter((r) => r.picture);
        setFinds((illustrated.length ? illustrated : results).slice(-4).reverse());
      })
      .catch(() => setFinds([]));

    Promise.all([
      api.get("/search/map").catch(() => ({ sites: [] })),
      api.get("/museums").catch(() => ({ museums: [] })),
    ]).then(([mapData, museumData]) => {
      const sites = mapData.sites || [];
      setFigures({
        artifacts: sites.reduce((sum, s) => sum + (s.artifact_count || 0), 0),
        sites: sites.length,
        museums: (museumData.museums || []).length,
      });
    });
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    navigate(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search");
  }

  return (
    <div className="page wide home">
      {/* ---- Masthead ---------------------------------------------------- */}
      <section className="masthead">
        <div>
          <span className="masthead-eyebrow">National Archaeological Register</span>
          <h1>
            Every find recorded.<br />
            Every site <em>protected</em>.
          </h1>
          <p className="masthead-lede">
            ArchiveEarth is the working record of Bangladesh&apos;s buried heritage — one register
            linking public discoveries, licensed excavations, museum collections, and the people
            who study them.
          </p>
          <div className="masthead-actions">
            {user ? (
              <>
                <Link className="btn" to={ROLE_HOME[user.role] || "/"}>
                  <LayoutDashboard size={16} aria-hidden="true" /> Open your workspace
                </Link>
                <Link className="btn btn-outline" to="/near-me">
                  <LocateFixed size={16} aria-hidden="true" /> Sites near you
                </Link>
              </>
            ) : (
              <>
                <Link className="btn" to="/register">
                  Create an account
                </Link>
                <Link className="btn btn-outline" to="/login">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="masthead-strata" aria-hidden="true">
          <StrataGraphic />
        </div>
      </section>

      {/* ---- Live figures ------------------------------------------------ */}
      {figures && (
        <div className="register-figures">
          <div className="register-figure">
            <b>{figures.artifacts.toLocaleString()}</b>
            <span>Artifacts catalogued</span>
          </div>
          <div className="register-figure">
            <b>{figures.sites.toLocaleString()}</b>
            <span>Recorded sites</span>
          </div>
          <div className="register-figure">
            <b>{figures.museums.toLocaleString()}</b>
            <span>Museums in the network</span>
          </div>
          <div className="register-figure">
            <b>{exhibitions.length.toLocaleString()}</b>
            <span>Exhibitions upcoming</span>
          </div>
        </div>
      )}

      {/* ---- Found something? ---------------------------------------------- */}
      <section className="home-cta">
        <div>
          <h2>Found something you think is old?</h2>
          <p>
            Leave it where it lies, photograph it, and log the location. A verified report is the
            first step in protecting the context around a find — which is usually worth more than
            the object itself.
          </p>
        </div>
        <div className="actions">
          <Link className="btn" to="/report-discovery">
            <MapPin size={16} aria-hidden="true" /> Report a find
          </Link>
          <Link className="btn btn-secondary" to="/knowledge">
            <BookOpen size={16} aria-hidden="true" /> Knowledge hub
          </Link>
        </div>
      </section>

      {/* ---- Catalogue search -------------------------------------------- */}
      <section className="home-search">
        <h2>Search the catalogue</h2>
        <p>
          Look up an artifact by name, civilization, era, region, material, use, or where it was
          found. No account is required to browse the public record.
        </p>
        <form className="home-search-row" onSubmit={handleSearch}>
          <label className="home-search-field">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. terracotta plaque, Pala period, Paharpur"
              aria-label="Search the artifact catalogue"
            />
          </label>
          <button type="submit" className="btn">
            Search catalogue
          </button>
        </form>
        <div className="home-search-suggestions">
          <span>Try:</span>
          {SUGGESTED.map((term) => (
            <Link key={term} to={`/search?q=${encodeURIComponent(term)}`}>
              {term}
            </Link>
          ))}
        </div>
      </section>

      {/* ---- Recently catalogued ----------------------------------------- */}
      {finds.length > 0 && (
        <>
          <div className="section-head">
            <h2>Recently catalogued</h2>
            <Link className="btn-link" to="/search">
              View the full catalogue <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="find-strip">
            {finds.map((item) => (
              <Link className="find" to={`/search?q=${encodeURIComponent(item.name)}`} key={item._id}>
                <div className="find-image">
                  {item.picture ? (
                    <img src={item.picture} alt={item.name} loading="lazy" />
                  ) : (
                    <Gem size={26} aria-hidden="true" />
                  )}
                </div>
                <div className="find-body">
                  <h4 title={item.name}>{item.name}</h4>
                  <p>
                    {[item.era, item.material].filter(Boolean).join(" · ") ||
                      item.site_name ||
                      "Provenance recorded"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* ---- Public index ------------------------------------------------ */}
      <div className="section-head">
        <h2>Explore the record</h2>
        <span className="hint">Open to everyone</span>
      </div>
      <ul className="index-list">
        {INDEX.map(({ to, num, icon: Icon, title, desc }) => (
          <li key={to}>
            <Link className="index-row" to={to}>
              <span className="index-num">{num}</span>
              <Icon size={19} aria-hidden="true" style={{ color: "var(--primary)", flexShrink: 0 }} />
              <span className="index-text">
                <h3>{title}</h3>
                <p>{desc}</p>
              </span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>

      {/* ---- How a find becomes a record --------------------------------- */}
      <div className="section-head">
        <h2>How a find becomes a record</h2>
      </div>
      <div className="process">
        {PROCESS.map((step) => (
          <div className="process-step" key={step.n}>
            <b>{step.n}</b>
            <h4>{step.title}</h4>
            <p>{step.body}</p>
          </div>
        ))}
      </div>

      {/* ---- Upcoming exhibitions ---------------------------------------- */}
      {exhibitions.length > 0 && (
        <>
          <div className="section-head">
            <h2>Upcoming exhibitions & events</h2>
            <Link className="btn-link" to="/exhibitions">
              View all listings <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <ul className="record-list">
            {exhibitions.slice(0, 4).map((e) => (
              <li className="record-row" key={e._id}>
                <div className="record-main">
                  <h4>{e.title}</h4>
                  <p className="record-meta">
                    {[e.museum_name || "Museum", e.location].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="record-side">
                  <span className="chip">
                    <CalendarDays size={13} aria-hidden="true" />
                    {formatDate(e.start_date)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

    </div>
  );
}
