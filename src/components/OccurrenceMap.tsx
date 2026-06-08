import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Occurrence } from "../types/occurrence";

interface OccurrenceMapProps {
  occurrences: Occurrence[];
  theme?: 'light' | 'dark';
}

const CENTER_BELEM: [number, number] = [-1.455, -48.470];

// Custom marker icons using Leaflet DivIcon and SVG
const createCustomIcon = (color: string) => {
  return L.divIcon({
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translateY(-12px);">
        <svg width="28" height="34" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 3px 4px rgba(0, 0, 0, 0.3));">
          <path d="M12 0C5.37 0 0 5.37 0 12C0 21 12 30 12 30C12 30 24 21 24 12C24 5.37 18.63 0 12 0Z" fill="${color}"/>
          <circle cx="12" cy="12" r="5" fill="white" />
        </svg>
      </div>
    `,
    className: "custom-leaflet-marker",
    iconSize: [28, 34],
    iconAnchor: [14, 34],
    popupAnchor: [0, -34],
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

export function OccurrenceMap({ occurrences, theme = 'dark' }: OccurrenceMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>(CENTER_BELEM);
  const [mapZoom, setMapZoom] = useState<number>(14);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  function locateUser() {
    if (!navigator.geolocation) {
      setLocateError("Geolocalização não suportada.");
      return;
    }
    setLocating(true);
    setLocateError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coord: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(coord);
        setMapCenter(coord);
        setMapZoom(15);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) {
          setLocateError("Permissão negada.");
        } else {
          setLocateError("Erro ao obter localização.");
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  const isDark = theme === 'dark';
  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

  return (
    <div className="map-shell" style={{ position: "relative", width: "100%" }}>
      <style>{`
        /* Map container override */
        .leaflet-container {
          width: 100%;
          height: 100%;
          border-radius: 12px;
          background: ${isDark ? "#1a1a1e" : "#f5f7fa"};
        }
        
        /* Zoom Control styling */
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
        .leaflet-control-zoom-in, .leaflet-control-zoom-out {
          background-color: ${isDark ? "#2a2a2a !important" : "#ffffff !important"};
          color: ${isDark ? "#ffffff !important" : "#007aff !important"};
          border: 1px solid ${isDark ? "#3e3e3e" : "#e5e7eb"} !important;
        }

        /* Popup styling */
        .leaflet-popup-content-wrapper {
          background-color: ${isDark ? "#1e1e1e" : "#ffffff"} !important;
          color: ${isDark ? "#ffffff" : "#111827"} !important;
          border-radius: 12px !important;
          padding: 4px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
          border: 1px solid ${isDark ? "#2a2a2a" : "#e5e7eb"} !important;
        }
        .leaflet-popup-tip {
          background-color: ${isDark ? "#1e1e1e" : "#ffffff"} !important;
          border: 1px solid ${isDark ? "#2a2a2a" : "#e5e7eb"} !important;
        }
        .leaflet-popup-close-button {
          color: ${isDark ? "#888" : "#9ca3af"} !important;
          padding: 6px 10px !important;
        }

        /* User location pulse animations */
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

      {/* Geolocate Button */}
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 1000 }}>
        <button
          type="button"
          onClick={locateUser}
          disabled={locating}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 12px",
            borderRadius: 12,
            backgroundColor: locating ? "#1565C0" : isDark ? "#2a2a2a" : "#ffffff",
            color: locating ? "#fff" : "#007aff",
            border: `1px solid ${isDark ? "#3e3e3e" : "#e5e7eb"}`,
            fontSize: 12,
            fontWeight: 700,
            cursor: locating ? "not-allowed" : "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          {locating ? (
            <>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Buscando...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
              Onde estou?
            </>
          )}
        </button>
        {locateError && (
          <div style={{
            marginTop: 4,
            fontSize: 11,
            color: "white",
            backgroundColor: "#ff3b30",
            padding: "4px 8px",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}>
            {locateError}
          </div>
        )}
      </div>

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        zoomControl={true}
        style={{ width: "100%", height: "100%" }}
      >
        <MapController center={mapCenter} zoom={mapZoom} />
        
        <TileLayer
          url={tileUrl}
          attribution={attribution}
        />

        {/* User position marker */}
        {userPos && (
          <Marker position={userPos} icon={createUserIcon()} />
        )}

        {/* Occurrence markers */}
        {occurrences
          .filter(
            (item) =>
              typeof item.latitude === "number" &&
              typeof item.longitude === "number" &&
              !isNaN(item.latitude) &&
              !isNaN(item.longitude)
          )
          .map((item) => {
            const color = item.severity === 'alta' ? '#ff3b30' : item.severity === 'média' ? '#ff9500' : '#34c759';
            return (
              <Marker
                key={item.id}
                position={[item.latitude, item.longitude]}
                icon={createCustomIcon(color)}
              >
                <Popup>
                  <div style={{ minWidth: 180, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", fontSize: 13 }}>
                    <h4 style={{ fontWeight: 700, fontSize: 13, margin: "0 0 6px", lineHeight: 1.3 }}>
                      {item.title}
                    </h4>
                    <p style={{ margin: "2px 0", fontSize: 11 }}>
                      📍 <span>{item.neighborhood}</span>
                    </p>
                    {item.address && (
                      <p style={{ margin: "2px 0", fontSize: 10, color: "#888", lineHeight: 1.2 }}>
                        {item.address}
                      </p>
                    )}
                    <div style={{
                      margin: "6px 0 2px",
                      fontSize: 10,
                      fontWeight: 700,
                      color: color,
                      textTransform: "uppercase"
                    }}>
                      Urgência: {item.severity}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}

export default OccurrenceMap;