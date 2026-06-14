import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { api } from './client'
import type {
  AdminGame,
  AdminSession,
  AdminUserConsistencyResponse,
  AdminUserListItem,
  Currency,
  LinkedPaymentStatus,
  Payment,
  PaymentMethod,
  Settings,
  UserPayment,
} from './types'

export interface UserPaymentRequestBody {
  readonly contact: string
  readonly notes: string
  readonly methodIds: readonly number[]
}

export interface PaymentRequestBody {
  readonly payerUserId: number
  readonly paymentMethodId: number | null
  readonly amount: number | null
  readonly currency: Currency
  readonly reference: string
  readonly notes: string
  readonly paidAt: string | null
  readonly status: LinkedPaymentStatus
  readonly beneficiaryUserIds: readonly number[]
}

export interface SetGameScoreVars {
  readonly gameId: number
  readonly team1Score: number
  readonly team2Score: number
  readonly winner: string
}

export interface SyncResult {
  readonly applied: boolean
  readonly team1Score?: number
  readonly team2Score?: number
  readonly message?: string
}

export function useSession(enabled: boolean): UseQueryResult<AdminSession, Error> {
  return useQuery({
    queryKey: ['session'],
    queryFn: async (): Promise<AdminSession> =>
      (await api.get<AdminSession>('/admin/auth/session')).data,
    enabled,
    retry: false,
  })
}

export function useUsers(): UseQueryResult<readonly AdminUserListItem[], Error> {
  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<readonly AdminUserListItem[]> =>
      (await api.get<readonly AdminUserListItem[]>('/admin/users')).data,
  })
}

export function useUserConsistency(
  userId: number,
): UseQueryResult<AdminUserConsistencyResponse, Error> {
  return useQuery({
    queryKey: ['consistency', userId],
    queryFn: async (): Promise<AdminUserConsistencyResponse> =>
      (await api.get<AdminUserConsistencyResponse>(`/admin/users/${userId}/consistency`)).data,
  })
}

export function useUserPayment(userId: number): UseQueryResult<UserPayment, Error> {
  return useQuery({
    queryKey: ['payment', userId],
    queryFn: async (): Promise<UserPayment> =>
      (await api.get<UserPayment>(`/admin/users/${userId}/payment`)).data,
  })
}

export function useUpsertUserPayment(
  userId: number,
): UseMutationResult<UserPayment, Error, UserPaymentRequestBody> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: UserPaymentRequestBody): Promise<UserPayment> =>
      (await api.put<UserPayment>(`/admin/users/${userId}/payment`, body)).data,
    onSuccess: (): void => {
      void qc.invalidateQueries({ queryKey: ['payment', userId] })
      void qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function usePaymentMethods(): UseQueryResult<readonly PaymentMethod[], Error> {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: async (): Promise<readonly PaymentMethod[]> =>
      (await api.get<readonly PaymentMethod[]>('/admin/payment-methods')).data,
  })
}

export function useCreatePaymentMethod(): UseMutationResult<PaymentMethod, Error, string> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (label: string): Promise<PaymentMethod> =>
      (await api.post<PaymentMethod>('/admin/payment-methods', { label })).data,
    onSuccess: (): void => {
      void qc.invalidateQueries({ queryKey: ['payment-methods'] })
    },
  })
}

export function useDeletePaymentMethod(): UseMutationResult<void, Error, number> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await api.delete(`/admin/payment-methods/${id}`)
    },
    onSuccess: (): void => {
      void qc.invalidateQueries({ queryKey: ['payment-methods'] })
    },
  })
}

export function useGames(): UseQueryResult<readonly AdminGame[], Error> {
  return useQuery({
    queryKey: ['games'],
    queryFn: async (): Promise<readonly AdminGame[]> =>
      (await api.get<readonly AdminGame[]>('/admin/games')).data,
  })
}

export function useSetGameScore(): UseMutationResult<void, Error, SetGameScoreVars> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ gameId, ...body }: SetGameScoreVars): Promise<void> => {
      await api.put(`/admin/games/${gameId}/score`, body)
    },
    onSuccess: (): void => {
      void qc.invalidateQueries({ queryKey: ['games'] })
    },
  })
}

export function useSyncGameScore(): UseMutationResult<SyncResult, Error, number> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (gameId: number): Promise<SyncResult> =>
      (await api.post<SyncResult>(`/admin/games/${gameId}/sync`)).data,
    onSuccess: (): void => {
      void qc.invalidateQueries({ queryKey: ['games'] })
    },
  })
}

// Payment status is derived, so every payment mutation also invalidates the
// users list (their paid badge may have changed) and any per-user payment view.
function invalidatePayments(qc: ReturnType<typeof useQueryClient>): void {
  void qc.invalidateQueries({ queryKey: ['payments'] })
  void qc.invalidateQueries({ queryKey: ['users'] })
  void qc.invalidateQueries({ queryKey: ['payment'] })
}

export function usePayments(): UseQueryResult<readonly Payment[], Error> {
  return useQuery({
    queryKey: ['payments'],
    queryFn: async (): Promise<readonly Payment[]> =>
      (await api.get<readonly Payment[]>('/admin/payments')).data,
  })
}

export function useUserPayments(userId: number): UseQueryResult<readonly Payment[], Error> {
  return useQuery({
    queryKey: ['payments', 'user', userId],
    queryFn: async (): Promise<readonly Payment[]> =>
      (await api.get<readonly Payment[]>(`/admin/users/${userId}/payments`)).data,
  })
}

export function useCreatePayment(): UseMutationResult<Payment, Error, PaymentRequestBody> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: PaymentRequestBody): Promise<Payment> =>
      (await api.post<Payment>('/admin/payments', body)).data,
    onSuccess: (): void => invalidatePayments(qc),
  })
}

export function useUpdatePayment(): UseMutationResult<
  Payment,
  Error,
  { readonly paymentId: number; readonly body: PaymentRequestBody }
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ paymentId, body }): Promise<Payment> =>
      (await api.put<Payment>(`/admin/payments/${paymentId}`, body)).data,
    onSuccess: (): void => invalidatePayments(qc),
  })
}

export function useDeletePayment(): UseMutationResult<void, Error, number> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (paymentId: number): Promise<void> => {
      await api.delete(`/admin/payments/${paymentId}`)
    },
    onSuccess: (): void => invalidatePayments(qc),
  })
}

export function useUploadPaymentProof(): UseMutationResult<
  Payment,
  Error,
  { readonly paymentId: number; readonly file: File }
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ paymentId, file }): Promise<Payment> => {
      const form = new FormData()
      form.append('proof', file)
      return (await api.post<Payment>(`/admin/payments/${paymentId}/proof`, form)).data
    },
    onSuccess: (): void => invalidatePayments(qc),
  })
}

export function useSettings(): UseQueryResult<Settings, Error> {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async (): Promise<Settings> => (await api.get<Settings>('/admin/settings')).data,
  })
}

export function useUpdateSettings(): UseMutationResult<Settings, Error, Settings> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Settings): Promise<Settings> =>
      (await api.put<Settings>('/admin/settings', body)).data,
    onSuccess: (): void => {
      void qc.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}
