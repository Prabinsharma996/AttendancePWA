import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { useAttendanceStore } from '../store/attendanceStore'
import { getLastLog, getAttendanceHistory, logAttendance } from '../api/attendance'

export const useAttendance = () => {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const { setLastLog } = useAttendanceStore()
  const userId = user?.id

  const lastLogQuery = useQuery({
    queryKey: ['attendance', 'last', userId],
    queryFn: async () => {
      const log = await getLastLog(userId!)
      setLastLog(log)
      return log
    },
    enabled: !!userId,
    staleTime: 1000 * 60,
  })

  const historyQuery = useQuery({
    queryKey: ['attendance', 'history', userId],
    queryFn: () => getAttendanceHistory(userId!, 60),
    enabled: !!userId,
  })

  const logMutation = useMutation({
    mutationFn: (logParams: Omit<Parameters<typeof logAttendance>[0], 'user_id' | 'org_id'>) =>
      logAttendance({ user_id: userId!, org_id: user!.org_id!, ...logParams }),
    onSuccess: (newLog) => {
      setLastLog(newLog)
      qc.invalidateQueries({ queryKey: ['attendance'] })
    },
  })

  return {
    lastLog: lastLogQuery.data ?? null,
    history: historyQuery.data ?? [],
    isLoading: lastLogQuery.isLoading,
    submitLog: logMutation.mutateAsync,
    isSubmitting: logMutation.isPending,
    error: logMutation.error,
  }
}
