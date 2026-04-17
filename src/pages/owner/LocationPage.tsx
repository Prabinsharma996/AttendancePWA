import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Trash2, Save, Pencil, Navigation, Power, PowerOff } from 'lucide-react'
import { LocationMap } from '../../components/LocationMap'
import { getLocations, saveLocation, deleteLocation } from '../../api/locations'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/Button'

export default function LocationPage() {
  const { user } = useAuthStore()
  const { data: locations = [], refetch } = useQuery({ queryKey: ['locations', user?.org_id], queryFn: () => getLocations(user!.org_id!) })
  
  const [draft, setDraft] = useState<{ lat: number; lng: number; radius_meters: number; name: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleMapClick = (lat: number, lng: number) => {
    setDraft(prev => prev ? { ...prev, lat, lng } : { lat, lng, radius_meters: 20, name: 'Main Office' })
  }

  const handleSave = async () => {
    if (!draft || !user?.org_id) return
    setSaving(true)
    try {
      await saveLocation({ 
        name: draft.name, latitude: draft.lat, longitude: draft.lng, 
        radius_meters: draft.radius_meters, is_active: true, org_id: user.org_id 
      })
      setDraft(null)
      refetch()
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (id: string, current: boolean) => {
    if (!user?.org_id) return
    setLoadingId(id)
    try {
      await saveLocation({ id, is_active: !current, org_id: user.org_id })
      refetch()
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setLoadingId(id)
    try { await deleteLocation(id); refetch() }
    finally { setLoadingId(null) }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Location Configuration</h1>
        <p className="text-slate-400 text-sm mt-1">Click on the map to define office geofence zones</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Map */}
        <div className="xl:col-span-2 h-[600px] relative">
          <LocationMap locations={locations} draftLocation={draft} onMapClick={handleMapClick} />
          {draft && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-4 py-2 rounded-full shadow-lg border border-slate-700 backdrop-blur-md flex items-center gap-3 text-sm z-10 font-mono">
              <Navigation className="w-4 h-4 text-sky-400" />
              {draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}
              <div className="w-px h-4 bg-slate-700 mx-1"></div>
              <span className="text-amber-400 font-semibold">{draft.radius_meters}m radius</span>
            </div>
          )}
        </div>

        {/* Panel */}
        <div className="flex flex-col gap-4">
          {/* Draft form */}
          {draft && (
            <div className="glass rounded-2xl p-5 border border-sky-500/30 bg-sky-900/10">
              <p className="text-sky-400 font-semibold mb-4 flex items-center gap-2">
                <Pencil className="w-4 h-4" /> Editing New Zone
              </p>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Zone Name</label>
                  <input value={draft.name} onChange={e => setDraft(d => d ? { ...d, name: e.target.value } : null)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-slate-400">Radius Range</label>
                    <span className="text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded">{draft.radius_meters}m</span>
                  </div>
                  <input type="range" min="10" max="500" step="5"
                    value={draft.radius_meters} onChange={e => setDraft(d => d ? { ...d, radius_meters: +e.target.value } : null)}
                    className="w-full accent-sky-500" />
                  <div className="flex text-[10px] text-slate-500 justify-between mt-1">
                    <span>10m</span><span>500m</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button onClick={handleSave} loading={saving} icon={<Save className="w-4 h-4" />} size="md" className="flex-1">Save Zone</Button>
                  <Button variant="ghost" size="md" onClick={() => setDraft(null)}>Cancel</Button>
                </div>
              </div>
            </div>
          )}

          {!draft && (
            <div className="glass rounded-2xl p-6 border border-slate-700/50 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                <MapPin className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-300 font-medium">Add a new geofence</p>
              <p className="text-sm text-slate-500 mt-1">Click anywhere on the map to define an office zone.</p>
            </div>
          )}

          {/* Saved Geofences */}
          <div className="glass rounded-2xl border border-slate-700/50 flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <p className="text-sm font-semibold text-slate-300">Configured Locations</p>
              <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full">{locations.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[350px]">
              {locations.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-10">No locations configured</p>
              ) : locations.map(g => (
                <div key={g.id} className="flex items-center justify-between px-4 py-4 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/20 transition-all">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${g.is_active ? 'bg-emerald-400' : 'bg-slate-600'}`}></div>
                      <p className={`text-sm font-medium truncate ${g.is_active ? 'text-white' : 'text-slate-400'}`}>{g.name}</p>
                    </div>
                    <p className="text-xs font-mono text-slate-500 truncate">{g.latitude.toFixed(5)}, {g.longitude.toFixed(5)} • {g.radius_meters}m</p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActive(g.id, g.is_active)} disabled={loadingId === g.id}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all" title={g.is_active ? "Deactivate" : "Activate"}>
                      {g.is_active ? <Power className="w-4 h-4 text-emerald-400" /> : <PowerOff className="w-4 h-4 text-red-400" />}
                    </button>
                    <button onClick={() => handleDelete(g.id)} disabled={loadingId === g.id}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
