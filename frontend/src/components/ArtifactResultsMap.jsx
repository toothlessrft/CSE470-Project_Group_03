import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER = [23.8103, 90.4125]; // Dhaka, Bangladesh

// sites: [{ _id, name, latitude, longitude, artifact_count }]
// onSelectSite: (site) => void
export default function ArtifactResultsMap({ sites, selectedSiteId, onSelectSite, height = 360 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: DEFAULT_CENTER, zoom: 7 });
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    sites.forEach((site) => {
      const marker = L.marker([site.latitude, site.longitude], { icon: markerIcon }).addTo(map);
      marker.bindPopup(`<strong>${site.name}</strong><br/>${site.artifact_count} artifact(s)`);
      marker.on("click", () => onSelectSite?.(site));
      if (site._id === selectedSiteId) marker.openPopup();
      markersRef.current.push(marker);
    });

    if (sites.length > 0) {
      const bounds = L.latLngBounds(sites.map((s) => [s.latitude, s.longitude]));
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sites, selectedSiteId]);

  return <div ref={containerRef} className="map-canvas" style={{ height }} />;
}
