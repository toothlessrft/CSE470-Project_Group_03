import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function coloredIcon(color) {
  return L.divIcon({
    className: "near-me-pin",
    html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 3px rgba(0,0,0,0.5);"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

const ICONS = {
  me: coloredIcon("#1a73e8"),
  site: coloredIcon("#2e7d32"),
  exhibition: coloredIcon("#8e44ad"),
  museum: coloredIcon("#b5834d"),
};

// center: { lat, lng }
// sites: [{ _id, name, latitude, longitude, artifact_count }]
// exhibitions: [{ _id, title, location:{lat,lng,address} }]
// museums: [{ museum_name, location:{lat,lng}, artifact_count }]
export default function NearMeMap({ center, sites = [], exhibitions = [], museums = [], height = 420 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: [center.lat, center.lng], zoom: 11 });
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const allPoints = [[center.lat, center.lng]];

    const me = L.marker([center.lat, center.lng], { icon: ICONS.me }).addTo(map);
    me.bindPopup("<strong>You are here</strong>");
    markersRef.current.push(me);

    sites.forEach((s) => {
      const m = L.marker([s.latitude, s.longitude], { icon: ICONS.site }).addTo(map);
      m.bindPopup(
        `<strong>${s.name}</strong><br/>Archaeological site &middot; ${s.artifact_count} artifact(s)<br/>${s.distance_km?.toFixed(1)} km away`
      );
      markersRef.current.push(m);
      allPoints.push([s.latitude, s.longitude]);
    });

    exhibitions.forEach((e) => {
      const m = L.marker([e.location.lat, e.location.lng], { icon: ICONS.exhibition }).addTo(map);
      m.bindPopup(
        `<strong>${e.title}</strong><br/>${e.museum_name || e.location.address || "Event"}<br/>${e.distance_km?.toFixed(1)} km away`
      );
      markersRef.current.push(m);
      allPoints.push([e.location.lat, e.location.lng]);
    });

    museums.forEach((mu) => {
      const m = L.marker([mu.location.lat, mu.location.lng], { icon: ICONS.museum }).addTo(map);
      m.bindPopup(
        `<strong>${mu.museum_name}</strong><br/>${mu.artifact_count} artifact(s) on record<br/>${mu.distance_km?.toFixed(1)} km away`
      );
      markersRef.current.push(m);
      allPoints.push([mu.location.lat, mu.location.lng]);
    });

    if (allPoints.length > 1) {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [30, 30], maxZoom: 13 });
    } else {
      map.setView([center.lat, center.lng], 12);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center, sites, exhibitions, museums]);

  return (
    <div>
      <div ref={containerRef} className="map-canvas" style={{ height }} />
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.8rem", marginTop: "0.5rem", color: "#555" }}>
        <span><span style={{ color: "#1a73e8" }}>●</span> You</span>
        <span><span style={{ color: "#2e7d32" }}>●</span> Archaeological sites</span>
        <span><span style={{ color: "#8e44ad" }}>●</span> Exhibitions &amp; events</span>
        <span><span style={{ color: "#b5834d" }}>●</span> Museums</span>
      </div>
    </div>
  );
}