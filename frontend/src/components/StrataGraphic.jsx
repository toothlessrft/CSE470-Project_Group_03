// Section drawing of a trench: six soil layers, a depth scale, and one find
// per layer at the depth it would come from. Decorative, so it is hidden from
// screen readers behind a single label.
const LAYERS = [
  { top: 20, fill: "#6e4423", label: "Modern" },
  { top: 82, fill: "#855433", label: "Medieval" },
  { top: 146, fill: "#9c6a3f", label: "Gupta" },
  { top: 214, fill: "#b3814f", label: "Mauryan" },
  { top: 282, fill: "#c99a63", label: "Chalcolithic" },
  { top: 348, fill: "#dbb47f", label: "Neolithic" },
];

const DEPTHS = [
  { y: 82, label: "1.0 m" },
  { y: 146, label: "2.0 m" },
  { y: 214, label: "3.0 m" },
  { y: 282, label: "4.0 m" },
  { y: 348, label: "5.0 m" },
];

function bandPath(y) {
  return `M40,${y} C90,${y - 7} 140,${y + 9} 190,${y + 1} S 270,${y - 8} 300,${y - 1} L300,400 L40,400 Z`;
}

export default function StrataGraphic() {
  return (
    <svg
      className="strata"
      viewBox="0 0 320 420"
      role="img"
      aria-label="Section drawing of an excavation trench showing finds recovered at successive soil layers"
    >
      <defs>
        <clipPath id="trench">
          <rect x="40" y="20" width="260" height="380" rx="8" />
        </clipPath>
      </defs>

      {/* Trench */}
      <rect x="40" y="20" width="260" height="380" rx="8" fill="#3f2313" />
      <g clipPath="url(#trench)">
        {LAYERS.map((layer, i) =>
          i === 0 ? (
            <rect key={layer.label} x="40" y="20" width="260" height="380" fill={layer.fill} />
          ) : (
            <path key={layer.label} d={bandPath(layer.top)} fill={layer.fill} />
          )
        )}
      </g>
      <rect
        x="40"
        y="20"
        width="260"
        height="380"
        rx="8"
        fill="none"
        stroke="rgba(247, 242, 234, 0.28)"
        strokeWidth="1"
      />

      {/* Depth scale */}
      <line x1="34" y1="20" x2="34" y2="400" stroke="rgba(247, 242, 234, 0.28)" strokeWidth="1" />
      <text x="28" y="26" textAnchor="end" fill="rgba(247,242,234,0.5)" fontSize="8" fontFamily="Inter, sans-serif">
        0.0 m
      </text>
      {DEPTHS.map((d) => (
        <g key={d.label}>
          <line x1="30" y1={d.y} x2="40" y2={d.y} stroke="rgba(247, 242, 234, 0.28)" strokeWidth="1" />
          <text
            x="26"
            y={d.y + 3}
            textAnchor="end"
            fill="rgba(247,242,234,0.5)"
            fontSize="8"
            fontFamily="Inter, sans-serif"
          >
            {d.label}
          </text>
        </g>
      ))}

      {/* Period labels, set into each layer */}
      {LAYERS.map((layer, i) => {
        const next = LAYERS[i + 1]?.top ?? 400;
        return (
          <text
            key={layer.label}
            x="56"
            y={(layer.top + next) / 2 + 3}
            fill="rgba(247,242,234,0.72)"
            fontSize="8.5"
            letterSpacing="1.6"
            fontFamily="Inter, sans-serif"
            fontWeight="600"
          >
            {layer.label.toUpperCase()}
          </text>
        );
      })}

      {/* Finds in situ */}
      <g stroke="#f7f2ea" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
        {/* Storage jar */}
        <g transform="translate(232, 100)">
          <path d="M2 0 h14" />
          <path d="M3 0 c-6 5 -8 14 -3 20 c4 5 14 5 18 0 c5 -6 3 -15 -3 -20" />
          <path d="M1 4 c-4 1 -5 5 -2 7" />
          <path d="M17 4 c4 1 5 5 2 7" />
        </g>
        {/* Punch-marked coin */}
        <g transform="translate(230, 168)">
          <circle cx="10" cy="10" r="9.5" />
          <circle cx="10" cy="10" r="4" />
          <path d="M10 0.5 v3 M10 16.5 v3 M0.5 10 h3 M16.5 10 h3" />
        </g>
        {/* Blade */}
        <g transform="translate(232, 234)">
          <path d="M8 0 L15 18 L8 24 L1 18 Z" />
          <path d="M8 4 v16" />
        </g>
        {/* Worked bone */}
        <g transform="translate(228, 302)">
          <path d="M4 18 L18 6" />
          <circle cx="3" cy="20" r="3" />
          <circle cx="7" cy="16" r="3" />
          <circle cx="19" cy="4" r="3" />
          <circle cx="15" cy="8" r="3" />
        </g>
        {/* Bead string */}
        <g transform="translate(226, 364)">
          <path d="M0 4 C7 14 17 14 24 4" />
          <circle cx="3" cy="8" r="2.4" />
          <circle cx="9" cy="11.5" r="2.4" />
          <circle cx="15" cy="11.5" r="2.4" />
          <circle cx="21" cy="8" r="2.4" />
        </g>
      </g>
    </svg>
  );
}
