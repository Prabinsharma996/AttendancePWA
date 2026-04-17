import { useEffect, useRef } from 'react'
import supabase from '../api/supabase'
import { useQueryClient } from '@tanstack/react-query'

export const useRealtimeAttendance = () => {
  const qc = useQueryClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    const channel = supabase
      .channel('attendance-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
        qc.invalidateQueries({ queryKey: ['attendance'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => {
        qc.invalidateQueries({ queryKey: ['leaves'] })
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [qc])
}
