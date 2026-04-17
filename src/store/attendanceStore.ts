import { create } from 'zustand'
import type { AttendanceLog } from '../types'

interface AttendanceState {
  lastLog: AttendanceLog | null
  isCheckedIn: boolean
  checkInTime: string | null
  setLastLog: (log: AttendanceLog | null) => void
  reset: () => void
}

export const useAttendanceStore = create<AttendanceState>()((set) => ({
  lastLog: null,
  isCheckedIn: false,
  checkInTime: null,

  setLastLog: (log) =>
    set({
      lastLog: log,
      isCheckedIn: log?.type === 'entry',
      checkInTime: log?.type === 'entry' ? log.timestamp : null,
    }),

  reset: () => set({ lastLog: null, isCheckedIn: false, checkInTime: null }),
}))
