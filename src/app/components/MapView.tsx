import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export type IssueStatus = "aberto" | "em_analise" | "resolvido";
export type IssueSeverity = "critical" | "high" | "medium" | "low";

export type Issue = {
  id: string;
  created_at: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  status: IssueStatus;
  address: string | null;
  neighborhood: string | null;
  lat: number | null;
  lng: number | null;
  photo_url: string | null;
  severity: IssueSeverity;
};

interface MapViewProps {
  darkMode: boolean;
  issues: Issue[];
  selectedIssue: Issue | null;
  onSelectIssue: (issue: Issue) => void;
}

const CENTER_BELEM: [number, number] = [-1.4558, -48.4902];

function MapFocus({ selectedIssue }: { selectedIssue: Issue | null }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedIssue) return;

    const hasValidCoords =
      typeof selectedIssue.lat === "number" &&
      typeof selectedIssue.lng === "number" &&
      !Number.isNaN(selectedIssue.lat) &&
      !Number.isNaN(selectedIssue.lng);

    if (!hasValidCoords) return;

    // at this point lat and lng are guaranteed to be numbers
    const lat = selectedIssue.lat as number;
    const lng = selectedIssue.lng as number;

    map.flyTo([lat, lng], 15, {
      duration: 1.2,
    });
  }, [selectedIssue, map]);

  return null;
}

export function MapView({
  darkMode,
  issues,
  selectedIssue,
  onSelectIssue,
}: MapViewProps) {
  const validIssues = issues.filter(
    (issue) =>
      typeof issue.lat === "number" &&
      typeof issue.lng === "number" &&
      !Number.isNaN(issue.lat) &&
      !Number.isNaN(issue.lng)
  );

  return (
    <div
      className="w-full h-full min-h-[520px] rounded-2xl overflow-hidden border"
      style={{
        borderColor: darkMode ? "#2a2a2a" : "#E8ECF0",
      }}
    >
      <MapContainer
        center={CENTER_BELEM}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ zIndex: 0 }}
      >
        <MapFocus selectedIssue={selectedIssue} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validIssues.map((issue) => (
          <Marker
            key={issue.id}
            position={[issue.lat as number, issue.lng as number]}
            eventHandlers={{
              click: () => onSelectIssue(issue),
            }}
          >
            <Popup>
              <div className="space-y-1 min-w-[180px]">
                <h3 className="font-semibold text-sm">{issue.title}</h3>

                {issue.neighborhood && (
                  <p className="text-xs">📍 {issue.neighborhood}</p>
                )}

                {issue.address && (
                  <p className="text-xs text-gray-500">{issue.address}</p>
                )}

                <p className="text-xs">
                  ⚠️ Severidade: <strong>{issue.severity}</strong>
                </p>

                <p className="text-xs">
                  📊 Status: <strong>{issue.status}</strong>
                </p>

                <p className="text-xs">
                  🗂 Categoria: <strong>{issue.category}</strong>
                </p>

                {issue.description && (
                  <p className="text-xs text-gray-600 mt-2">
                    {issue.description}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}