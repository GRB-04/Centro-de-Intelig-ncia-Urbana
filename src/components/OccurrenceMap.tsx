import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import type { Occurrence } from '../types/occurrence'

interface OccurrenceMapProps {
  occurrences: Occurrence[]
}

delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown })._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function OccurrenceMap({ occurrences }: OccurrenceMapProps) {
  useEffect(() => {
    // Mantido para garantir montagem limpa do Leaflet
  }, [])

  return (
    <div className="map-shell">
      <MapContainer center={[-1.4558, -48.4902]} zoom={13} scrollWheelZoom>
        <TileLayer
          attribution='&copy; MapTiler &copy; OpenStreetMap contributors'
          url={`https://api.maptiler.com/maps/topo-v4/{z}/{x}/{y}.png?key=${import.meta.env.VITE_MAPTILER_API_KEY}`}
        />

        {occurrences.map((item) => (
          <Marker key={item.id} position={[item.latitude, item.longitude]}>
            <Popup>
              <h4 className="custom-popup-title">{item.title}</h4>
              <p className="custom-popup-text">{item.neighborhood}</p>
              <p className="custom-popup-text">{item.address}</p>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export default OccurrenceMap