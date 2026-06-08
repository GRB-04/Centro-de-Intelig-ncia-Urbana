import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Issue, IssueStatus, IssueSeverity } from "../Dashboard";

interface MapViewProps {
  darkMode: boolean;
  issues: Issue[];
  selectedIssue: Issue | null;
  onSelectIssue: (issue: Issue | null) => void;
}

const CENTER_BELEM = {
  longitude: -48.4902,
  latitude: -1.4558,
};

const SEVERITY_COLORS: Record<IssueSeverity, string> = {
  critical: "#E53935",
  high: "#FF9800",
  medium: "#FFC107",
  low: "#4CAF50",
};

const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  critical: "Crítico",
  high: "Alto",
  medium: "Médio",
  low: "Baixo",
};

const STATUS_LABELS: Record<IssueStatus, string> = {
  aberto: "Aberta",
  em_analise: "Em Análise",
  resolvido: "Resolvida",
};

const STATUS_COLORS: Record<IssueStatus, string> = {
  aberto: "#E53935",
  em_analise: "#FF9800",
  resolvido: "#2E7D32",
};

// Custom marker icons using Leaflet DivIcon and SVG
const createCustomIcon = (color: string, isSelected: boolean) => {
  const size = isSelected ? 36 : 28;
  return L.divIcon({
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translateY(-12px); cursor: pointer; transition: transform 0.2s ease;">
        <svg width="${size}" height="${size + 6}" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 3px 4px rgba(0, 0, 0, 0.35));">
          <path d="M12 0C5.37 0 0 5.37 0 12C0 21 12 30 12 30C12 30 24 21 24 12C24 5.37 18.63 0 12 0Z" fill="${color}"/>
          <circle cx="12" cy="12" r="5" fill="white" />
          ${isSelected ? '<circle cx="12" cy="12" r="7" stroke="white" stroke-width="1.5" fill="none" />' : ""}
        </svg>
      </div>
    `,
    className: "custom-leaflet-marker",
    iconSize: [size, size + 6],
    iconAnchor: [size / 2, size + 6],
  });
};

const createUserIcon = () => {
  return L.divIcon({
    html: `
      <div class="user-location-marker">
        <div class="user-location-pulse"></div>
        <div class="user-location-dot"></div>
      </div>
    `,
    className: "user-leaflet-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Map controller component to programmatically pan/zoom
interface MapControllerProps {
  center: [number, number];
  zoom: number;
}

function MapController({ center, zoom }: MapControllerProps) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

export function MapView({
  darkMode,
  issues,
  selectedIssue,
  onSelectIssue,
}: MapViewProps) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  const [mapCenter, setMapCenter] = useState<[number, number]>([
    CENTER_BELEM.latitude,
    CENTER_BELEM.longitude,
  ]);
  const [mapZoom, setMapZoom] = useState<number>(12);

  // When selectedIssue changes, fly to it
  useEffect(() => {
    if (!selectedIssue) return;
    if (
      typeof selectedIssue.lat !== "number" ||
      typeof selectedIssue.lng !== "number" ||
      Number.isNaN(selectedIssue.lat) ||
      Number.isNaN(selectedIssue.lng)
    )
      return;

    setMapCenter([selectedIssue.lat, selectedIssue.lng]);
    setMapZoom(15.5);
  }, [selectedIssue]);

  function locateUser() {
    if (!navigator.geolocation) {
      setLocateError("Geolocalização não suportada neste navegador.");
      return;
    }
    setLocating(true);
    setLocateError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coord: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(coord);
        setLocating(false);
        setMapCenter(coord);
        setMapZoom(16);
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) {
          setLocateError("Permissão de localização negada. Libere no navegador.");
        } else if (err.code === 3) {
          setLocateError("Tempo esgotado ao buscar localização.");
        } else {
          setLocateError("Não foi possível obter sua localização.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  const validIssues = issues.filter(
    (i) =>
      typeof i.lat === "number" &&
      typeof i.lng === "number" &&
      !Number.isNaN(i.lat) &&
      !Number.isNaN(i.lng)
  );

  const tileUrl = darkMode
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

  return (
    <div
      className="w-full h-full min-h-[520px] rounded-2xl overflow-hidden relative"
      style={{ border: `1px solid ${darkMode ? "#2a2a2a" : "#E8ECF0"}` }}
    >
      {/* Custom styles to color popup and styling */}
      <style>{`
        .leaflet-popup-content-wrapper {
          background-color: ${darkMode ? "#1e1e1e" : "#ffffff"} !important;
          color: ${darkMode ? "#ffffff" : "#111827"} !important;
          border-radius: 12px !important;
          padding: 8px 12px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
          border: 1px solid ${darkMode ? "#2a2a2a" : "#e5e7eb"} !important;
        }
        .leaflet-popup-tip {
          background-color: ${darkMode ? "#1e1e1e" : "#ffffff"} !important;
          border: 1px solid ${darkMode ? "#2a2a2a" : "#e5e7eb"} !important;
        }
        .leaflet-popup-close-button {
          color: ${darkMode ? "#888" : "#9ca3af"} !important;
          padding: 6px 10px !important;
          font-size: 16px !important;
          outline: none !important;
        }
        .leaflet-popup-close-button:hover {
          color: ${darkMode ? "#fff" : "#111827"} !important;
          background-color: transparent !important;
        }
        @keyframes map-pulse {
          0% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          70% {
            transform: scale(2.2);
            opacity: 0;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
        .user-location-marker {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }
        .user-location-pulse {
          position: absolute;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #2563eb;
          animation: map-pulse 2s infinite;
        }
        .user-location-dot {
          position: relative;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background-color: #2563eb;
          border: 2px solid #ffffff;
          box-shadow: 0 0 6px rgba(0,0,0,0.3);
        }
      `}</style>

      {/* Locate Me Button */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={locateUser}
          disabled={locating}
          title="Mostrar minha localização"
          className="flex items-center gap-2 px-3 h-9 rounded-xl text-sm font-semibold transition-all shadow-md"
          style={{
            backgroundColor: locating ? "#1565C0" : darkMode ? "#1e1e1e" : "#fff",
            color: locating ? "#fff" : "#1565C0",
            border: `1px solid ${darkMode ? "#333" : "#1565C0"}`,
            cursor: locating ? "not-allowed" : "pointer",
            opacity: locating ? 0.85 : 1,
          }}
        >
          {locating ? (
            <>
              <svg
                className="animate-spin"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                style={{ animation: "spin 1s linear infinite" }}
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Buscando…
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" strokeOpacity="0" fill="#1565C0" fillOpacity="0.15" />
              </svg>
              Minha localização
            </>
          )}
        </button>

        {locateError && (
          <div
            className="text-xs px-3 py-2 rounded-xl max-w-[220px] text-right"
            style={{
              backgroundColor: "rgba(239,68,68,.92)",
              color: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            {locateError}
          </div>
        )}

        {userPos && !locateError && (
          <div
            className="text-xs px-3 py-2 rounded-xl"
            style={{
              backgroundColor: "rgba(21,101,192,0.92)",
              color: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            📍 Você está aqui
          </div>
        )}
      </div>

      {/* Severity Legend */}
      <div
        className="absolute bottom-3 left-3 z-[1000] flex flex-col gap-1 px-3 py-2 rounded-xl pointer-events-auto"
        style={{
          backgroundColor: darkMode ? "rgba(30,30,30,0.92)" : "rgba(255,255,255,0.92)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
          border: `1px solid ${darkMode ? "#333" : "#E8ECF0"}`,
        }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: darkMode ? "#888" : "#9CA3AF" }}>
          Severidade
        </span>
        {(["critical", "high", "medium", "low"] as IssueSeverity[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: SEVERITY_COLORS[s] }}
            />
            <span className="text-[11px]" style={{ color: darkMode ? "#ccc" : "#374151" }}>
              {SEVERITY_LABELS[s]}
            </span>
          </div>
        ))}
      </div>

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        zoomControl={true}
        style={{ width: "100%", height: "100%" }}
      >
        <MapController center={mapCenter} zoom={mapZoom} />

        <TileLayer url={tileUrl} attribution={attribution} />

        {/* User location marker */}
        {userPos && (
          <Marker position={userPos} icon={createUserIcon()} />
        )}

        {/* Issue markers */}
        {validIssues.map((issue) => {
          const isSelected = selectedIssue?.id === issue.id;
          const severity = (issue.severity ?? "medium") as IssueSeverity;
          const color = SEVERITY_COLORS[severity] ?? "#1565C0";

          return (
            <Marker
              key={issue.id}
              position={[issue.lat as number, issue.lng as number]}
              icon={createCustomIcon(color, isSelected)}
              eventHandlers={{
                click: () => {
                  onSelectIssue(issue);
                },
              }}
            />
          );
        })}

        {/* Issue Popup */}
        {selectedIssue && typeof selectedIssue.lat === "number" && typeof selectedIssue.lng === "number" && (
          <Popup
            position={[selectedIssue.lat, selectedIssue.lng]}
            eventHandlers={{
              remove: () => onSelectIssue(null),
            }}
          >
            <div style={{ minWidth: 210, fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    backgroundColor: (SEVERITY_COLORS[selectedIssue.severity] ?? "#1565C0") + "22",
                    color: SEVERITY_COLORS[selectedIssue.severity] ?? "#1565C0",
                    border: `1px solid ${SEVERITY_COLORS[selectedIssue.severity] ?? "#1565C0"}44`,
                  }}
                >
                  {SEVERITY_LABELS[selectedIssue.severity] ?? selectedIssue.severity}
                </span>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    backgroundColor: (STATUS_COLORS[selectedIssue.status] ?? "#9CA3AF") + "22",
                    color: STATUS_COLORS[selectedIssue.status] ?? "#9CA3AF",
                    border: `1px solid ${STATUS_COLORS[selectedIssue.status] ?? "#9CA3AF"}44`,
                  }}
                >
                  {STATUS_LABELS[selectedIssue.status] ?? selectedIssue.status}
                </span>
              </div>

              <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, lineHeight: 1.3, margin: "0 0 4px" }}>
                {selectedIssue.title}
              </p>

              {selectedIssue.neighborhood && (
                <p style={{ color: "#6B7280", fontSize: 11, margin: "2px 0" }}>
                  📍 {selectedIssue.neighborhood}
                </p>
              )}
              {selectedIssue.address && (
                <p style={{ color: "#9CA3AF", fontSize: 11, margin: "2px 0" }}>
                  {selectedIssue.address}
                </p>
              )}
              <p style={{ color: "#9CA3AF", fontSize: 11, margin: "2px 0" }}>
                🗂 {selectedIssue.category}
              </p>

              {selectedIssue.photo_url && (
                <img
                  src={selectedIssue.photo_url}
                  alt={selectedIssue.title}
                  style={{ width: "100%", borderRadius: 8, marginTop: 8, objectFit: "cover", maxHeight: 120 }}
                />
              )}

              {selectedIssue.description && (
                <p
                  style={{
                    color: "#6B7280",
                    fontSize: 11,
                    marginTop: 6,
                    lineHeight: 1.4,
                    borderTop: `1px solid ${darkMode ? "#2a2a2a" : "#E8ECF0"}`,
                    paddingTop: 6,
                  }}
                >
                  {selectedIssue.description.length > 120
                    ? selectedIssue.description.slice(0, 120) + "…"
                    : selectedIssue.description}
                </p>
              )}
            </div>
          </Popup>
        )}
      </MapContainer>
    </div>
  );
}