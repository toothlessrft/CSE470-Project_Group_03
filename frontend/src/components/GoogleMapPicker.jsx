import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/*
  Location picker built on Leaflet + OpenStreetMap. No API key, no billing
  account, works immediately. Same public interface as before:
    value    -> { lat, lng, address } | null
    onChange -> ({ lat, lng, address }) => void
    editable -> click/drag/search to set a point vs. read-only marker
*/

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

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await res.json();
    return data.display_name || "";
  } catch {
    return "";
  }
}

async function searchPlace(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
  );
  return res.json();
}

export default function GoogleMapPicker({ value, onChange, editable = true, height = 320 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const setPositionRef = useRef(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center = value?.lat != null ? [value.lat, value.lng] : DEFAULT_CENTER;
    const map = L.map(containerRef.current, {
      center,
      zoom: value?.lat != null ? 15 : 7,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    function attachDrag() {
      markerRef.current.on("dragend", () => {
        const pos = markerRef.current.getLatLng();
        setPosition(pos.lat, pos.lng);
      });
    }

    async function setPosition(lat, lng) {
      if (!markerRef.current) {
        markerRef.current = L.marker([lat, lng], { icon: markerIcon, draggable: editable }).addTo(map);
        if (editable) attachDrag();
      } else {
        markerRef.current.setLatLng([lat, lng]);
      }
      map.panTo([lat, lng]);
      const address = await reverseGeocode(lat, lng);
      onChange?.({ lat, lng, address });
    }
    setPositionRef.current = setPosition;

    if (value?.lat != null) {
      markerRef.current = L.marker(center, { icon: markerIcon, draggable: editable }).addTo(map);
      if (editable) attachDrag();
    }

    if (editable) {
      map.on("click", (e) => setPosition(e.latlng.lat, e.latlng.lng));
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || value?.lat == null) return;
    const pos = [value.lat, value.lng];
    if (!markerRef.current) {
      markerRef.current = L.marker(pos, { icon: markerIcon, draggable: editable }).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng(pos);
    }
    mapRef.current.panTo(pos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng]);

  function handleSearch(e) {
    e?.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    searchPlace(query)
      .then(setResults)
      .finally(() => setSearching(false));
  }

  function handleSearchKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  }

  function selectResult(r) {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    mapRef.current.setView([lat, lng], 16);
    setPositionRef.current?.(lat, lng);
    setResults([]);
    setQuery(r.display_name);
  }

  return (
    <div className="map-picker">
      {editable && (
        <div className="map-search-row">
          <input
            type="text"
            className="map-search"
            placeholder="Search for a place or address..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <button type="button" className="btn-small" disabled={searching} onClick={() => handleSearch()}>
            {searching ? "..." : "Search"}
          </button>
        </div>
      )}
      {results.length > 0 && (
        <ul className="map-results">
          {results.map((r) => (
            <li key={r.place_id} onClick={() => selectResult(r)}>
              {r.display_name}
            </li>
          ))}
        </ul>
      )}
      <div ref={containerRef} className="map-canvas" style={{ height }} />
      {editable && (
        <p className="hint">Click anywhere on the map, drag the pin, or search above to set the exact spot.</p>
      )}
    </div>
  );
}