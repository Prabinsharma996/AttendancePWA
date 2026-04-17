import supabase from './supabase'
import type { Location } from '../types'

export const getLocations = async (orgId: string): Promise<Location[]> => {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export const saveLocation = async (location: Partial<Location> & { org_id: string }): Promise<Location> => {
  if (location.id) {
    const { data, error } = await supabase.from('locations').update(location).eq('id', location.id).select().single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase.from('locations').insert(location).select().single()
    if (error) throw error
    return data
  }
}

export const deleteLocation = async (id: string) => {
  const { error } = await supabase.from('locations').delete().eq('id', id)
  if (error) throw error
}
