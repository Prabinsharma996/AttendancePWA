import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { RadarUI } from '../../components/RadarUI'
import { useGeolocation } from '../../hooks/useGeolocation'
import { useBiometric } from '../../hooks/useBiometric'
import { useAttendance } from '../../hooks/useAttendance'
import { useAuthStore } from '../../store/authStore'
import { getLocations } from '../../api/locations'

export default function StaffRadar() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: locations = [] } = useQuery({ 
    queryKey: ['locations', user?.org_id], 
    queryFn: () => getLocations(user!.org_id!),
    enabled: !!user?.org_id
  })

  const { lat, lng, accuracy, error: geoError, loading: geoLoading, getDistanceTo } = useGeolocation()
  const { isSupported, verify } = useBiometric()
  const { lastLog, submitLog, isSubmitting } = useAttendance()
  
  const isCheckedIn = lastLog?.type === 'entry'

  // Find nearest location
  const { distanceToNearest, nearestLocation } = useMemo(() => {
    if (!locations.length || lat === null || lng === null) return { distanceToNearest: null, nearestLocation: null }
    let minD = Infinity
    let nearest = null
    for (const loc of locations) {
      if (!loc.is_active) continue
      const d = getDistanceTo(loc.latitude, loc.longitude)
      if (d !== null && d < minD) {
        minD = d; nearest = loc
      }
    }
    return { distanceToNearest: minD === Infinity ? null : minD, nearestLocation: nearest }
  }, [locations, lat, lng, getDistanceTo])

  const handleAction = async () => {
    // Biometric skip if not supported for now, though rules could strictly enforce it
    const bioSuccess = isSupported() ? await verify(user!.id) : true
    if (!bioSuccess) return

    await submitLog({
      type: isCheckedIn ? 'exit' : 'entry',
      location_id: nearestLocation?.id,
      latitude: lat ?? undefined,
      longitude: lng ?? undefined,
      distance_from_zone: distanceToNearest ?? undefined,
      biometric_verified: isSupported(),
      is_valid: true
    })
    
    // Send them back to home upon success
    navigate('/staff')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <div className="mb-8 text-center text-balance">
        <h1 className="text-3xl font-bold text-white mb-2">
          {isCheckedIn ? 'Ready to exit?' : 'Ready to work?'}
        </h1>
        <p className="text-slate-400 text-sm">Position yourself within the office geofence.</p>
      </div>

      <RadarUI
        locations={locations}
        lat={lat}
        lng={lng}
        accuracy={accuracy}
        distanceToNearest={distanceToNearest}
        nearestLocation={nearestLocation}
        geoLoading={geoLoading}
        geoError={geoError}
        isSupported={isSupported()}
        isCheckedIn={isCheckedIn}
        isCheckingIn={isSubmitting}
        onAction={handleAction}
      />
    </div>
  )
}
