import { useState, useEffect, useCallback, useRef } from 'react'
import type { GeolocationState } from '../types'

export const haversineDistance = (
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number => {
  const R = 6371000 // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const useGeolocation = (active: boolean = true) => {
  const [state, setState] = useState<GeolocationState>({
    lat: null, lng: null, accuracy: null, error: null, loading: true,
  })

  const updatePosition = useCallback((pos: GeolocationPosition) => {
    setState({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      error: pos.coords.accuracy > 50 ? 'GPS accuracy poor (>50m). Move outdoors or check settings.' : null,
      loading: false,
    })
  }, [])

  const handleError = useCallback((err: GeolocationPositionError) => {
    setState(prev => ({ ...prev, error: err.message, loading: false }))
  }, [])

  useEffect(() => {
    if (!active) return
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation not supported', loading: false }))
      return
    }

    // High accuracy fetch immediately
    navigator.geolocation.getCurrentPosition(updatePosition, handleError, { enableHighAccuracy: true })

    // Poll every 5 seconds for continuous tracking while active
    const timer = setInterval(() => {
      navigator.geolocation.getCurrentPosition(updatePosition, handleError, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 4000
      })
    }, 5000)

    return () => clearInterval(timer)
  }, [updatePosition, handleError, active])

  const getDistanceTo = useCallback(
    (geofenceLat: number, geofenceLng: number): number | null => {
      if (state.lat === null || state.lng === null) return null
      return haversineDistance(state.lat, state.lng, geofenceLat, geofenceLng)
    },
    [state.lat, state.lng]
  )

  const isWithinZone = useCallback(
    (geofenceLat: number, geofenceLng: number, radiusMeters: number): boolean => {
      const dist = getDistanceTo(geofenceLat, geofenceLng)
      if (dist === null) return false
      return dist <= radiusMeters
    },
    [getDistanceTo]
  )

  return { ...state, isWithinZone, getDistanceTo }
}
