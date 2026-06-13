import { Chip } from '@mui/material'
import type { ConsistencyStatus, PaymentStatus } from '../api/types'

export function ConsistencyChip({ status }: { status: ConsistencyStatus }) {
  const map: Record<ConsistencyStatus, { label: string; color: 'success' | 'error' | 'default' }> = {
    CONSISTENT: { label: 'Consistente', color: 'success' },
    INCONSISTENT: { label: 'Inconsistente', color: 'error' },
    NO_PREDICTIONS: { label: 'Sin predicciones', color: 'default' },
  }
  const { label, color } = map[status]
  return <Chip size="small" label={label} color={color} />
}

export function PaymentChip({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, { label: string; color: 'success' | 'warning' | 'default' }> = {
    VERIFIED: { label: 'Verificado', color: 'success' },
    PENDING: { label: 'Pendiente', color: 'warning' },
    UNPAID: { label: 'Sin pagar', color: 'default' },
  }
  const { label, color } = map[status]
  return <Chip size="small" label={label} color={color} />
}

export function LoginTypeChip({ type }: { type: string }) {
  return <Chip size="small" variant="outlined" label={type} />
}
