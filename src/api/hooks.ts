import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type {
  AdminGame,
  AdminSession,
  AdminUserConsistencyResponse,
  AdminUserListItem,
  PaymentMethod,
  UserPayment,
} from './types'

export interface UserPaymentRequestBody {
  status: string
  contact: string
  notes: string
  methodIds: number[]
}

export function useSession(enabled: boolean) {
  return useQuery({
    queryKey: ['session'],
    queryFn: async () => (await api.get<AdminSession>('/admin/auth/session')).data,
    enabled,
    retry: false,
  })
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<AdminUserListItem[]>('/admin/users')).data,
  })
}

export function useUserConsistency(userId: number) {
  return useQuery({
    queryKey: ['consistency', userId],
    queryFn: async () =>
      (await api.get<AdminUserConsistencyResponse>(`/admin/users/${userId}/consistency`)).data,
  })
}

export function useUserPayment(userId: number) {
  return useQuery({
    queryKey: ['payment', userId],
    queryFn: async () => (await api.get<UserPayment>(`/admin/users/${userId}/payment`)).data,
  })
}

export function useUpsertUserPayment(userId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: UserPaymentRequestBody) =>
      (await api.put<UserPayment>(`/admin/users/${userId}/payment`, body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment', userId] })
      qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => (await api.get<PaymentMethod[]>('/admin/payment-methods')).data,
  })
}

export function useCreatePaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (label: string) =>
      (await api.post<PaymentMethod>('/admin/payment-methods', { label })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-methods'] }),
  })
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/payment-methods/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-methods'] }),
  })
}

export function useGames() {
  return useQuery({
    queryKey: ['games'],
    queryFn: async () => (await api.get<AdminGame[]>('/admin/games')).data,
  })
}

export function useSetGameScore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { gameId: number; team1Score: number; team2Score: number; winner: string }) => {
      const { gameId, ...body } = args
      await api.put(`/admin/games/${gameId}/score`, body)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['games'] }),
  })
}

export function useSyncGameScore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (gameId: number) =>
      (await api.post<{ applied: boolean; message?: string }>(`/admin/games/${gameId}/sync`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['games'] }),
  })
}
