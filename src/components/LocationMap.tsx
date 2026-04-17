import { useState, useCallback, useMemo } from 'react'
import { MapContainer, TileLayer, Circle, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { Location } from '../types'

// Fix leaflet default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface MapEventsHandlerProps {
  onMapClick: (lat: number, lng: number) => void
}

const MapEventsHandler = ({ onMapClick }: MapEventsHandlerProps) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

interface Props {
  locations: Location[]
  draftLocation?: { lat: number; lng: number; radius_meters: number; name: string } | null
  onMapClick: (lat: number, lng: number) => void
  center?: [number, number]
}

export const LocationMap = ({ locations, draftLocation, onMapClick, center = [27.7172, 85.3240] }: Props) => {
  // If there's a draft, center on it, otherwise use provided center
  const mapCenter = useMemo(() => draftLocation ? [draftLocation.lat, draftLocation.lng] : center, [draftLocation, center])

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-700 relative">
      <MapContainer
        center={mapCenter as [number, number]}
        zoom={15}
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEventsHandler onMapClick={onMapClick} />

        {locations.map(g => (
          <div key={g.id}>
            {g.is_active && (
              <Circle
                center={[g.latitude, g.longitude]}
                radius={g.radius_meters}
                color={g.is_active ? "#0ea5e9" : "#64748b"}
                fillColor={g.is_active ? "#0ea5e9" : "#64748b"}
                fillOpacity={0.15}
                weight={2}
              />
            )}
            <Marker position={[g.latitude, g.longitude]} opacity={g.is_active ? 1 : 0.5} />
          </div>
        ))}

        {draftLocation && (
          <div key="draft">
            <Marker position={[draftLocation.lat, draftLocation.lng]} />
            <Circle
              center={[draftLocation.lat, draftLocation.lng]}
              radius={draftLocation.radius_meters}
              color="#f59e0b"
              fillColor="#f59e0b"
              fillOpacity={0.25}
              weight={3}
              dashArray="8"
            />
          </div>
        )}
      </MapContainer>
    </div>
  )
}
