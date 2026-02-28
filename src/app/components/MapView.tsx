import { useState } from "react";
import {
  Layers,
  ZoomIn,
  ZoomOut,
  Navigation,
  X,
  Calendar,
  Users,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { ISSUES, Issue } from "../data/issues";

interface MapViewProps {
  darkMode: boolean;
  selectedIssue: Issue | null;
  onSelectIssue: (issue: Issue | null) => void;
}

const SEVERITY_COLORS = {
  critical: "#E53935",
  high: "#FF9800",
  medium: "#FFC107",
  low: "#4CAF50",
};

const STATUS_CONFIG = {
  Open: { label: "Aberta", color: "#E53935" },
  "In Analysis": { label: "Em Análise", color: "#FF9800" },
  Forwarded: { label: "Encaminhada", color: "#1565C0" },
  Resolved: { label: "Resolvida", color: "#2E7D32" },
};

function MapPin({ x, y, issue, darkMode, isSelected, onClick }: {
  x: number; y: number; issue: Issue; darkMode: boolean; isSelected: boolean; onClick: () => void;
}) {
  const color = SEVERITY_COLORS[issue.severity];
  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      {/* Pulse ring for critical */}
      {issue.severity === "critical" && (
        <circle r={isSelected ? 20 : 16} fill={color} opacity={0.15}>
          <animate attributeName="r" values="14;20;14" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.05;0.2" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      {/* Outer ring */}
      <circle
        r={isSelected ? 12 : 9}
        fill={color}
        opacity={0.25}
        style={{ transition: "r 0.2s" }}
      />
      {/* Pin body */}
      <circle
        r={isSelected ? 8 : 6}
        fill={color}
        stroke={darkMode ? "#1E1E1E" : "#fff"}
        strokeWidth={2}
        style={{ transition: "r 0.2s" }}
      />
      {/* Pin dot */}
      <circle r={2.5} fill={darkMode ? "#1E1E1E" : "#fff"} />
    </g>
  );
}

export function MapView({ darkMode, selectedIssue, onSelectIssue }: MapViewProps) {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [popupIssue, setPopupIssue] = useState<Issue | null>(null);

  const handlePinClick = (issue: Issue) => {
    if (popupIssue?.id === issue.id) {
      setPopupIssue(null);
    } else {
      setPopupIssue(issue);
      onSelectIssue(issue);
    }
  };

  const waterColor = darkMode ? "#0d1e2e" : "#C8DCF0";
  const landColor = darkMode ? "#1a1f2e" : "#EEF2E8";
  const gridColor = darkMode ? "#252b3a" : "#E2E8D8";
  const roadColor = darkMode ? "#2a3245" : "#D4DAC8";
  const majorRoadColor = darkMode ? "#363e52" : "#C4CDB8";
  const parkColor = darkMode ? "#1a2820" : "#D4E8C4";
  const buildingColor = darkMode ? "#222838" : "#DDDFD4";
  const textColor = darkMode ? "#4a5568" : "#8A9A7A";

  return (
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden relative"
      style={{
        backgroundColor: darkMode ? "#1E1E1E" : "#FFFFFF",
        border: `1px solid ${darkMode ? "#2a2a2a" : "#EEF1F5"}`,
        boxShadow: darkMode ? "0 0 0 1px rgba(255,255,255,0.04)" : "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      {/* Map Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{
          borderBottom: `1px solid ${darkMode ? "#2a2a2a" : "#EEF1F5"}`,
          backgroundColor: darkMode ? "#1E1E1E" : "#FFFFFF",
        }}
      >
        <div>
          <h2
            className="text-base"
            style={{ color: darkMode ? "#FFFFFF" : "#1D1D1F", fontWeight: 700 }}
          >
            Mapa de Ocorrências
          </h2>
          <p className="text-xs" style={{ color: darkMode ? "#666" : "#9CA3AF" }}>
            Belém, Pará — Visualização em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Heatmap toggle */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="flex items-center gap-1.5 text-xs px-3 h-8 rounded-xl transition-all"
            style={{
              backgroundColor: showHeatmap
                ? darkMode ? "#0d1a2e" : "#E3F0FF"
                : darkMode ? "#2a2a2a" : "#F5F7FA",
              color: showHeatmap ? "#1565C0" : darkMode ? "#888" : "#6B7280",
              border: `1px solid ${showHeatmap ? "#1565C0" : darkMode ? "#333" : "#E8ECF0"}`,
            }}
          >
            <Layers size={12} />
            <span>Mapa de Calor</span>
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative overflow-hidden">
        <svg
          viewBox="0 0 640 480"
          className="w-full h-full"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center", transition: "transform 0.3s" }}
        >
          <defs>
            {/* Heatmap gradients */}
            <radialGradient id="heat1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E53935" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#E53935" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heat2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E53935" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#E53935" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heat3" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF9800" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FF9800" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heat4" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF9800" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#FF9800" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heat5" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E53935" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#E53935" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* === LAND BASE === */}
          <rect x="0" y="0" width="640" height="480" fill={landColor} />

          {/* === WATER BODY (Baía do Guajará – South) === */}
          <path
            d="M 0 410 Q 80 400 130 415 Q 180 428 220 412 Q 265 398 310 408 Q 350 418 390 405 Q 440 390 490 402 Q 545 415 600 405 L 640 408 L 640 480 L 0 480 Z"
            fill={waterColor}
          />
          {/* River to the left (Rio Guamá) */}
          <path
            d="M 0 250 Q 30 255 50 270 Q 65 285 55 310 Q 45 335 60 360 Q 75 385 60 410 L 0 410 Z"
            fill={waterColor}
          />

          {/* Water shimmer lines */}
          <g opacity="0.3">
            <path d="M 50 430 Q 150 425 250 432" stroke={darkMode ? "#1a3a5c" : "#B0CCE8"} strokeWidth="1" fill="none" />
            <path d="M 100 450 Q 200 445 320 452" stroke={darkMode ? "#1a3a5c" : "#B0CCE8"} strokeWidth="1" fill="none" />
            <path d="M 350 440 Q 450 435 580 442" stroke={darkMode ? "#1a3a5c" : "#B0CCE8"} strokeWidth="1" fill="none" />
          </g>

          {/* === PARK AREA (Parque Estadual do Utinga) === */}
          <ellipse cx="520" cy="340" rx="55" ry="45" fill={parkColor} />
          <text x="520" y="342" textAnchor="middle" fontSize="7" fill={textColor} fontWeight="500">Parque</text>
          <text x="520" y="352" textAnchor="middle" fontSize="7" fill={textColor}>Utinga</text>

          {/* Small park */}
          <ellipse cx="330" cy="290" rx="25" ry="20" fill={parkColor} />
          <text x="330" y="293" textAnchor="middle" fontSize="6.5" fill={textColor}>Praça</text>

          {/* === BUILDING BLOCKS (stylized city grid) === */}
          {/* Bengui area - top left */}
          {[
            [80, 80], [110, 80], [80, 100], [110, 100],
            [140, 80], [80, 120], [110, 120], [140, 120],
          ].map(([x, y], i) => (
            <rect key={`b-${i}`} x={x} y={y} width="22" height="14" rx="2" fill={buildingColor} />
          ))}

          {/* Marco area - center */}
          {[
            [270, 130], [300, 130], [330, 130], [360, 130],
            [270, 150], [300, 150], [330, 150], [360, 150],
            [270, 170], [300, 170], [360, 170],
            [270, 190], [330, 190], [360, 190],
          ].map(([x, y], i) => (
            <rect key={`m-${i}`} x={x} y={y} width="22" height="14" rx="2" fill={buildingColor} />
          ))}

          {/* Batista Campos area */}
          {[
            [330, 200], [360, 200], [390, 200], [420, 200],
            [330, 220], [360, 220], [390, 220], [420, 220],
            [330, 240], [360, 240], [390, 240],
          ].map(([x, y], i) => (
            <rect key={`bc-${i}`} x={x} y={y} width="22" height="14" rx="2" fill={buildingColor} />
          ))}

          {/* Nazaré/Umarizal area */}
          {[
            [240, 220], [240, 240], [240, 260],
            [260, 220], [260, 240], [260, 260],
            [280, 240], [280, 260],
          ].map(([x, y], i) => (
            <rect key={`n-${i}`} x={x} y={y} width="22" height="14" rx="2" fill={buildingColor} />
          ))}

          {/* Sacramenta area */}
          {[
            [440, 180], [470, 180], [500, 180], [440, 200],
            [470, 200], [500, 200], [440, 220], [470, 220],
          ].map(([x, y], i) => (
            <rect key={`s-${i}`} x={x} y={y} width="22" height="14" rx="2" fill={buildingColor} />
          ))}

          {/* Guamá area */}
          {[
            [140, 240], [170, 240], [200, 240],
            [140, 260], [170, 260], [200, 260],
            [140, 280], [170, 280], [200, 280],
            [140, 300], [170, 300],
          ].map(([x, y], i) => (
            <rect key={`g-${i}`} x={x} y={y} width="22" height="14" rx="2" fill={buildingColor} />
          ))}

          {/* Comércio / Cidade Velha area */}
          {[
            [220, 340], [250, 340], [280, 340], [310, 340],
            [220, 360], [250, 360], [280, 360],
            [220, 380], [250, 380],
          ].map(([x, y], i) => (
            <rect key={`cv-${i}`} x={x} y={y} width="22" height="14" rx="2" fill={buildingColor} />
          ))}

          {/* Pedreira area */}
          {[
            [390, 130], [420, 130], [450, 130],
            [390, 150], [420, 150], [450, 150],
          ].map(([x, y], i) => (
            <rect key={`p-${i}`} x={x} y={y} width="22" height="14" rx="2" fill={buildingColor} />
          ))}

          {/* === MAJOR ROADS === */}
          {/* Av. Almirante Barroso – horizontal through center */}
          <path d="M 0 175 L 640 175" stroke={majorRoadColor} strokeWidth="5" />
          <path d="M 0 175 L 640 175" stroke={darkMode ? "#3a4258" : "#B8C4A8"} strokeWidth="1" strokeDasharray="8,6" />

          {/* Av. Augusto Montenegro – top horizontal */}
          <path d="M 0 110 Q 200 108 400 115 Q 500 118 640 112" stroke={majorRoadColor} strokeWidth="4" fill="none" />

          {/* BR-316 diagonal */}
          <path d="M 640 80 L 540 175 L 480 220 L 430 260 L 380 310 L 340 360 L 280 410" stroke={majorRoadColor} strokeWidth="4" fill="none" />

          {/* Av. Nazaré – diagonal center-south */}
          <path d="M 320 130 L 290 180 L 268 240 L 255 300 L 248 360 L 240 410" stroke={majorRoadColor} strokeWidth="3.5" fill="none" />

          {/* Av. Gentil Bittencourt */}
          <path d="M 160 110 L 175 175 L 188 240 L 195 310 L 195 380" stroke={roadColor} strokeWidth="3" fill="none" />

          {/* Radial streets */}
          <path d="M 80 175 L 150 240 L 180 310 L 170 380" stroke={roadColor} strokeWidth="2.5" fill="none" />
          <path d="M 350 175 L 390 240 L 420 300 L 450 360 L 470 400" stroke={roadColor} strokeWidth="2.5" fill="none" />
          <path d="M 450 130 L 465 175 L 480 240 L 490 300" stroke={roadColor} strokeWidth="2.5" fill="none" />

          {/* Cross streets */}
          <path d="M 60 240 L 640 230" stroke={roadColor} strokeWidth="2" />
          <path d="M 80 300 L 500 295" stroke={roadColor} strokeWidth="2" />
          <path d="M 120 360 L 480 355" stroke={roadColor} strokeWidth="2" />

          {/* Grid verticals */}
          <path d="M 200 100 L 205 400" stroke={gridColor} strokeWidth="1.5" />
          <path d="M 310 100 L 312 420" stroke={gridColor} strokeWidth="1.5" />
          <path d="M 415 100 L 418 380" stroke={gridColor} strokeWidth="1.5" />
          <path d="M 540 100 L 542 380" stroke={gridColor} strokeWidth="1.5" />

          {/* === NEIGHBORHOOD LABELS === */}
          <text x="118" y="100" fontSize="8" fill={textColor} fontWeight="600" textAnchor="middle" letterSpacing="0.05em">BENGUI</text>
          <text x="318" y="120" fontSize="8" fill={textColor} fontWeight="600" textAnchor="middle" letterSpacing="0.05em">MARCO</text>
          <text x="395" y="195" fontSize="8" fill={textColor} fontWeight="600" textAnchor="middle" letterSpacing="0.05em">BATISTA CAMPOS</text>
          <text x="264" y="215" fontSize="8" fill={textColor} fontWeight="600" textAnchor="middle" letterSpacing="0.05em">NAZARÉ</text>
          <text x="175" y="235" fontSize="8" fill={textColor} fontWeight="600" textAnchor="middle" letterSpacing="0.05em">GUAMÁ</text>
          <text x="470" y="175" fontSize="8" fill={textColor} fontWeight="600" textAnchor="middle" letterSpacing="0.05em">SACRAMENTA</text>
          <text x="420" y="125" fontSize="8" fill={textColor} fontWeight="600" textAnchor="middle" letterSpacing="0.05em">PEDREIRA</text>
          <text x="255" y="330" fontSize="8" fill={textColor} fontWeight="600" textAnchor="middle" letterSpacing="0.05em">COMÉRCIO</text>
          <text x="250" y="400" fontSize="8" fill={textColor} fontWeight="600" textAnchor="middle" letterSpacing="0.05em">CIDADE VELHA</text>

          {/* Road labels */}
          <text x="420" y="170" fontSize="7" fill={darkMode ? "#4a5568" : "#a0a890"} transform="rotate(-8, 420, 170)">Av. Almirante Barroso</text>
          <text x="80" y="105" fontSize="7" fill={darkMode ? "#4a5568" : "#a0a890"}>Av. Augusto Montenegro</text>

          {/* Water labels */}
          <text x="300" y="455" fontSize="9" fill={darkMode ? "#1e3a5a" : "#86A8C4"} textAnchor="middle" fontWeight="500" letterSpacing="0.1em">BAÍA DO GUAJARÁ</text>
          <text x="28" y="330" fontSize="7.5" fill={darkMode ? "#1e3a5a" : "#86A8C4"} textAnchor="middle" fontWeight="500" transform="rotate(-90, 28, 330)">RIO GUAMÁ</text>

          {/* === HEATMAP LAYER === */}
          {showHeatmap && (
            <g>
              <ellipse cx="318" cy="175" rx="70" ry="55" fill="url(#heat1)" />
              <ellipse cx="262" cy="355" rx="65" ry="50" fill="url(#heat2)" />
              <ellipse cx="125" cy="120" rx="60" ry="45" fill="url(#heat5)" />
              <ellipse cx="180" cy="280" rx="55" ry="45" fill="url(#heat3)" />
              <ellipse cx="475" cy="205" rx="50" ry="40" fill="url(#heat4)" />
            </g>
          )}

          {/* === MAP PINS === */}
          {ISSUES.map((issue) => (
            <MapPin
              key={issue.id}
              x={issue.mapCoords.x}
              y={issue.mapCoords.y}
              issue={issue}
              darkMode={darkMode}
              isSelected={selectedIssue?.id === issue.id || popupIssue?.id === issue.id}
              onClick={() => handlePinClick(issue)}
            />
          ))}

          {/* Compass */}
          <g transform="translate(600, 55)">
            <circle r="18" fill={darkMode ? "#2a2a2a" : "#fff"} stroke={darkMode ? "#333" : "#E8ECF0"} strokeWidth="1" />
            <text x="0" y="-6" textAnchor="middle" fontSize="8" fill={darkMode ? "#888" : "#6B7280"} fontWeight="700">N</text>
            <path d="M 0 -4 L -3 5 L 0 3 L 3 5 Z" fill="#E53935" />
            <path d="M 0 4 L -3 -5 L 0 -3 L 3 -5 Z" fill={darkMode ? "#555" : "#ccc"} />
          </g>

          {/* Scale */}
          <g transform="translate(30, 455)">
            <rect x="0" y="-4" width="60" height="6" rx="2" fill={darkMode ? "#2a2a2a" : "#fff"} opacity="0.8" />
            <line x1="5" y1="0" x2="55" y2="0" stroke={darkMode ? "#888" : "#6B7280"} strokeWidth="1.5" />
            <line x1="5" y1="-3" x2="5" y2="3" stroke={darkMode ? "#888" : "#6B7280"} strokeWidth="1.5" />
            <line x1="55" y1="-3" x2="55" y2="3" stroke={darkMode ? "#888" : "#6B7280"} strokeWidth="1.5" />
            <text x="30" y="-5" textAnchor="middle" fontSize="6" fill={darkMode ? "#888" : "#6B7280"}>2 km</text>
          </g>
        </svg>

        {/* Map Controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: darkMode ? "#2a2a2a" : "#fff",
              border: `1px solid ${darkMode ? "#333" : "#E8ECF0"}`,
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <ZoomIn size={14} color={darkMode ? "#ccc" : "#4B5563"} />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.6))}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: darkMode ? "#2a2a2a" : "#fff",
              border: `1px solid ${darkMode ? "#333" : "#E8ECF0"}`,
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <ZoomOut size={14} color={darkMode ? "#ccc" : "#4B5563"} />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: darkMode ? "#2a2a2a" : "#fff",
              border: `1px solid ${darkMode ? "#333" : "#E8ECF0"}`,
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <Navigation size={14} color={darkMode ? "#ccc" : "#4B5563"} />
          </button>
        </div>

        {/* Legend */}
        <div
          className="absolute bottom-3 right-3 flex flex-col gap-1.5 p-2.5 rounded-xl"
          style={{
            backgroundColor: darkMode ? "rgba(30,30,30,0.95)" : "rgba(255,255,255,0.95)",
            border: `1px solid ${darkMode ? "#2a2a2a" : "#EEF1F5"}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            backdropFilter: "blur(8px)",
          }}
        >
          <p className="text-xs mb-1" style={{ color: darkMode ? "#888" : "#9CA3AF", fontWeight: 600 }}>
            Severidade
          </p>
          {(["critical", "high", "medium", "low"] as const).map((sev) => (
            <div key={sev} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[sev] }} />
              <span className="text-xs" style={{ color: darkMode ? "#ccc" : "#4B5563" }}>
                {sev === "critical" ? "Crítico" : sev === "high" ? "Alto" : sev === "medium" ? "Médio" : "Baixo"}
              </span>
            </div>
          ))}
        </div>

        {/* Pin Popup */}
        {popupIssue && (
          <div
            className="absolute top-3 left-3 w-72 rounded-2xl overflow-hidden"
            style={{
              backgroundColor: darkMode ? "#1E1E1E" : "#FFFFFF",
              border: `1px solid ${darkMode ? "#2a2a2a" : "#EEF1F5"}`,
              boxShadow: darkMode
                ? "0 4px 24px rgba(0,0,0,0.5)"
                : "0 4px 24px rgba(0,0,0,0.12)",
            }}
          >
            {/* Image */}
            <div className="relative h-32 overflow-hidden">
              <img src={popupIssue.image} alt={popupIssue.title} className="w-full h-full object-cover" />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" }}
              />
              <button
                onClick={() => { setPopupIssue(null); onSelectIssue(null); }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
              >
                <X size={12} color="#fff" />
              </button>
              <span
                className="absolute bottom-2 left-2 text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: SEVERITY_COLORS[popupIssue.severity],
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "10px",
                }}
              >
                {popupIssue.severity === "critical" ? "Crítico" : popupIssue.severity === "high" ? "Alto" : popupIssue.severity === "medium" ? "Médio" : "Baixo"}
              </span>
            </div>

            {/* Content */}
            <div className="p-3">
              <h3
                className="text-sm mb-1 leading-tight"
                style={{ color: darkMode ? "#fff" : "#1D1D1F", fontWeight: 700 }}
              >
                {popupIssue.title}
              </h3>
              <p className="text-xs mb-3" style={{ color: darkMode ? "#666" : "#9CA3AF" }}>
                {popupIssue.address}
              </p>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { icon: <Calendar size={10} />, label: "Dias aberta", value: popupIssue.status === "Resolved" ? "Resolvida" : `${popupIssue.daysOpen}d` },
                  { icon: <Users size={10} />, label: "Afetados", value: popupIssue.estimatedAffected.toLocaleString("pt-BR") },
                  { icon: <AlertTriangle size={10} />, label: "Status", value: STATUS_CONFIG[popupIssue.status].label },
                ].map(({ icon, label, value }, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-2 text-center"
                    style={{ backgroundColor: darkMode ? "#2a2a2a" : "#F5F7FA" }}
                  >
                    <div className="flex justify-center mb-0.5" style={{ color: darkMode ? "#888" : "#9CA3AF" }}>
                      {icon}
                    </div>
                    <p className="text-xs" style={{ color: darkMode ? "#fff" : "#1D1D1F", fontWeight: 700 }}>
                      {value}
                    </p>
                    <p style={{ fontSize: "9px", color: darkMode ? "#555" : "#9CA3AF" }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Priority Score */}
              <div
                className="rounded-xl p-3 mb-3"
                style={{
                  backgroundColor: darkMode ? "#1a0a0a" : "#FFF5F5",
                  border: `1px solid ${darkMode ? "#3a1515" : "#FFE0E0"}`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: darkMode ? "#ff8080" : "#E53935", fontWeight: 700 }}>
                    Pontuação de Prioridade: {popupIssue.priorityScore}
                  </span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: SEVERITY_COLORS[popupIssue.severity],
                      color: "#fff",
                      fontSize: "9px",
                      fontWeight: 600,
                    }}
                  >
                    {popupIssue.severity === "critical" ? "Alta Severidade" : popupIssue.severity === "high" ? "Severidade Alta" : "Severidade Média"}
                  </span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full mb-1"
                  style={{ backgroundColor: darkMode ? "#2a1515" : "#FFD4D4" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${popupIssue.priorityScore}%`,
                      backgroundColor: SEVERITY_COLORS[popupIssue.severity],
                    }}
                  />
                </div>
                <p style={{ fontSize: "9px", color: darkMode ? "#666" : "#9CA3AF" }}>
                  Calculado com base em votos, tempo aberto e categoria.
                </p>
              </div>

              <button
                className="w-full flex items-center justify-center gap-1.5 h-8 rounded-xl text-xs transition-all"
                style={{
                  backgroundColor: "#1565C0",
                  color: "#fff",
                  fontWeight: 600,
                }}
              >
                <ExternalLink size={12} />
                Ver Detalhes Completos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
