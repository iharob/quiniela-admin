import { useMemo } from 'react'
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { usePayments, useSettings, useUsers } from '../api/hooks'
import { extractError } from '../api/client'
import { SectionTitle } from '../components/SectionTitle'

function formatUsd(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} USD`
}

function MetricCard({
  label,
  value,
  color,
}: {
  readonly label: string
  readonly value: string
  readonly color?: string
}): JSX.Element {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, color }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  )
}

export function DashboardPage(): JSX.Element {
  const { data: users, isLoading, error } = useUsers()
  const { data: settings } = useSettings()
  const { data: payments } = usePayments()

  const stats = useMemo(() => {
    const fee = settings?.entryFeeUsd ?? 0
    const list = users ?? []
    // Only users with predictions are expected to pay; each counts as `fee`.
    const participants = list.filter((u) => u.hasPredictions)
    const paid = participants.filter((u) => u.paymentStatus === 'VERIFIED').length
    const pending = participants.filter((u) => u.paymentStatus === 'PENDING').length
    const total = participants.length
    const unpaid = total - paid - pending
    // Collected is the actual money in: the sum of verified payment amounts
    // (treated as USD, per the single-currency assumption).
    const collected = (payments ?? [])
      .filter((p) => p.status === 'VERIFIED')
      .reduce((sum, p) => sum + (p.amount ?? 0), 0)
    const expected = total * fee
    return {
      fee,
      total,
      paid,
      pending,
      unpaid,
      collected,
      expected,
      remaining: Math.max(0, expected - collected),
    }
  }, [users, settings, payments])

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }
  if (error) return <Alert severity="error">{extractError(error)}</Alert>

  return (
    <Stack spacing={2} sx={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      <SectionTitle>Resumen</SectionTitle>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard label="Recaudado" value={formatUsd(stats.collected)} color="success.main" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard label="Por cobrar" value={formatUsd(stats.remaining)} color="warning.main" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard label="Total esperado" value={formatUsd(stats.expected)} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard label="Cuota / participante" value={formatUsd(stats.fee)} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}>
          <MetricCard label="Participantes" value={String(stats.total)} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard label="Pagados" value={String(stats.paid)} color="success.main" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard label="Pendientes" value={String(stats.pending)} color="warning.main" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard label="Sin pagar" value={String(stats.unpaid)} />
        </Grid>
      </Grid>

      <Typography variant="caption" color="text.secondary">
        Recaudado = suma de los pagos verificados (en USD). El total esperado y lo que falta por
        cobrar asumen {formatUsd(stats.fee)} por participante (usuarios con predicciones).
      </Typography>
    </Stack>
  )
}
