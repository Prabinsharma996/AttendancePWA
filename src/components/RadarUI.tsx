import { clsx } from 'clsx'
import { Fingerprint, MapPin, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { Location } from '../types'
import { Button } from './Button'

interface Props {
  locations: Location[]
  lat: number | null
  lng: number | null
  accuracy: number | null
  distanceToNearest: number | null
  nearestLocation: Location | null
  geoLoading: boolean
  geoError: string | null
  isSupported: boolean
  isCheckedIn: boolean
  isCheckingIn: boolean
  onAction: () => void
}

export const RadarUI = ({
  locations, lat, lng, accuracy, distanceToNearest, nearestLocation,
  geoLoading, geoError, isSupported, isCheckedIn, isCheckingIn, onAction
}: Props) => {
  const isWithinZone = nearestLocation && distanceToNearest !== null && distanceToNearest <= nearestLocation.radius_meters
  const isAccurate = accuracy !== null && accuracy <= 50

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {/* Radar Canvas Container */}
      <div className="relative w-72 h-72 rounded-full border border-slate-700 bg-slate-900/50 flex items-center justify-center overflow-hidden shadow-2xl shadow-sky-500/10">
        
        {/* Radar grids */}
        <div className="absolute inset-0 rounded-full border border-slate-800 m-10"></div>
        <div className="absolute inset-0 rounded-full border border-slate-800 m-20"></div>
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-800"></div>
        <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-800"></div>

        {/* Radar Sweeper */}
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_70%,rgba(14,165,233,0.3)_100%)] animate-[spin_3s_linear_infinite] rounded-full origin-center"></div>

        {/* Central Pulse (User) */}
        <div className={clsx(
          "absolute w-4 h-4 rounded-full z-10 transition-colors duration-500",
          geoLoading ? "bg-slate-500" : isWithinZone ? "bg-emerald-400" : "bg-red-500"
        )}>
          {/* User Ping effect */}
          <div className={clsx(
            "absolute inset-0 rounded-full animate-ping opacity-75",
            isWithinZone ? "bg-emerald-400" : "bg-red-500"
          )}></div>
        </div>

        {/* Office Context Overlay (Visual only) */}
        {nearestLocation && (
          <div className="absolute z-0" style={{ 
              transform: `translate(${Math.min(Math.max((distanceToNearest ?? 0) / 2, -100), 100)}px, ${Math.min(Math.max((distanceToNearest ?? 0) / 2, -100), 100)}px)` 
            }}>
            <div className="w-24 h-24 rounded-full border-2 border-sky-500/30 bg-sky-500/5 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-sky-500/50" />
            </div>
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="glass w-full rounded-3xl p-5 text-center flex flex-col items-center gap-3">
        {geoLoading ? (
          <div className="text-slate-400 text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Acquiring GPS lock...
          </div>
        ) : geoError ? (
          <div className="text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {geoError}
          </div>
        ) : !isAccurate ? (
          <div className="text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> GPS accuracy too low (~{Math.round(accuracy ?? 0)}m).
          </div>
        ) : nearestLocation ? (
          <>
            <p className="text-slate-300 font-medium">{nearestLocation.name}</p>
            {isWithinZone ? (
             <div className="text-emerald-400 font-bold flex items-center gap-2">
               <CheckCircle2 className="w-5 h-5 pulse" /> You are in the zone
             </div>
            ) : (
             <div className="text-red-400 font-semibold flex items-center gap-2">
               You are {Math.round(distanceToNearest ?? 0)}m away. Move closer.
             </div>
            )}
          </>
        ) : (
          <div className="text-slate-400 text-sm">No active office locations found.</div>
        )}

        <Button 
          disabled={isCheckingIn || geoLoading || !!geoError || !isAccurate || !isWithinZone}
          onClick={onAction}
          icon={isCheckingIn ? undefined : <Fingerprint className="w-5 h-5" />}
          loading={isCheckingIn}
          variant={isCheckedIn ? 'danger' : 'primary'}
          size="lg"
          className="w-full mt-2"
        >
          {isCheckedIn ? 'Record Exit Log' : 'Record Entry Log'}
        </Button>

        {!isSupported && <p className="text-xs text-amber-500 mt-2">Biometrics not supported on this device.</p>}
      </div>
    </div>
  )
}
