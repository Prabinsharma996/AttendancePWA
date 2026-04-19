import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { 
  getLeaveTypes, getMyLeaveBalances, getMyLeaveRequests, 
  getAllLeaveRequestsByOrg, submitLeaveRequest, reviewLeaveRequest,
  createLeaveType, deleteLeaveType
} from '../api/leaves'

export const useLeave = () => {
  const qc = useQueryClient()
  const { user } = useAuthStore()

  const typesQuery = useQuery({
    queryKey: ['leave_types', user?.org_id],
    queryFn: () => getLeaveTypes(user!.org_id!),
    enabled: !!user?.org_id,
  })

  const myBalancesQuery = useQuery({
    queryKey: ['leave_balances', user?.id],
    queryFn: () => getMyLeaveBalances(user!.id, new Date().getFullYear()),
    enabled: !!user?.id,
  })

  const myRequestsQuery = useQuery({
    queryKey: ['leave_requests', user?.id],
    queryFn: () => getMyLeaveRequests(user!.id),
    enabled: !!user?.id,
  })

  // Owner only
  const allRequestsQuery = useQuery({
    queryKey: ['leave_requests_all', user?.org_id],
    queryFn: () => getAllLeaveRequestsByOrg(user!.org_id!),
    enabled: !!user?.org_id && user?.role === 'owner',
  })

  const submitMutation = useMutation({
    mutationFn: (request: Omit<Parameters<typeof submitLeaveRequest>[0], 'user_id' | 'org_id'>) => 
      submitLeaveRequest({ ...request, user_id: user!.id, org_id: user!.org_id! }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave_requests'] })
    },
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string, status: 'approved'|'rejected', reason?: string }) => 
      reviewLeaveRequest(id, status, user!.id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave_requests_all'] })
    },
  })

  return {
    types: typesQuery.data ?? [],
    myBalances: myBalancesQuery.data ?? [],
    myRequests: myRequestsQuery.data ?? [],
    allRequests: allRequestsQuery.data ?? [],
    isLoading: typesQuery.isLoading || myRequestsQuery.isLoading,
    submitLeave: submitMutation.mutateAsync,
    reviewLeave: reviewMutation.mutateAsync,
    createType: useMutation({
      mutationFn: (type: { name: string, max_days_per_year: number, is_paid: boolean }) => 
        createLeaveType({ ...type, org_id: user!.org_id!, carry_forward: false, requires_approval: true }),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['leave_types'] })
    }).mutateAsync,
    deleteType: useMutation({
      mutationFn: deleteLeaveType,
      onSuccess: () => qc.invalidateQueries({ queryKey: ['leave_types'] })
    }).mutateAsync,
  }
}
