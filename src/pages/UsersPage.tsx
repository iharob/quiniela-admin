import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { usePaymentMethods, useUsers } from '../api/hooks'
import { extractError } from '../api/client'
import { ConsistencyChip, LoginTypeChip, PaymentChip } from '../components/chips'
import { SectionTitle } from '../components/SectionTitle'
import { SortCell, useSort, type SortValue } from '../components/sort'
import type { AdminUserListItem } from '../api/types'

function userSortValue(u: AdminUserListItem, key: string): SortValue {
  switch (key) {
    case 'userId':
      return u.userId
    case 'name':
      return u.name
    case 'email':
      return u.email
    case 'loginType':
      return u.loginType
    case 'hasPredictions':
      return u.hasPredictions
    case 'consistency':
      return u.consistency
    case 'paymentStatus':
      return u.paymentStatus
    case 'paymentMethods':
      return u.paymentMethods.join(', ')
    default:
      return undefined
  }
}

interface FilterOption {
  readonly value: string
  readonly label: string
}

const LOGIN_TYPE_OPTIONS: readonly FilterOption[] = [
  { value: 'google', label: 'Google' },
  { value: 'email', label: 'Email' },
  { value: 'both', label: 'Ambos' },
  { value: 'none', label: 'Ninguno' },
]

const PREDICTION_OPTIONS: readonly FilterOption[] = [
  { value: 'yes', label: 'Con predicciones' },
  { value: 'no', label: 'Sin predicciones' },
]

const CONSISTENCY_OPTIONS: readonly FilterOption[] = [
  { value: 'CONSISTENT', label: 'Consistente' },
  { value: 'INCONSISTENT', label: 'Inconsistente' },
  { value: 'NO_PREDICTIONS', label: 'Sin predicciones' },
]

const PAYMENT_STATUS_OPTIONS: readonly FilterOption[] = [
  { value: 'VERIFIED', label: 'Verificado' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'UNPAID', label: 'Sin pagar' },
]

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  readonly label: string
  readonly value: string
  readonly onChange: (value: string) => void
  readonly options: readonly FilterOption[]
}): JSX.Element {
  return (
    <FormControl size="small" sx={{ minWidth: 160 }}>
      <InputLabel sx={{ fontSize: 14 }}>{label}</InputLabel>
      <Select
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={{ fontSize: 14 }}
      >
        <MenuItem value="all" sx={{ fontSize: 14 }}>
          Todos
        </MenuItem>
        {options.map((o) => (
          <MenuItem key={o.value} value={o.value} sx={{ fontSize: 14 }}>
            {o.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export function UsersPage(): JSX.Element {
  const navigate = useNavigate()
  const { data, isLoading, error } = useUsers()
  const { data: methods } = usePaymentMethods()

  const [query, setQuery] = useState('')
  const [loginType, setLoginType] = useState('all')
  const [predictions, setPredictions] = useState('all')
  const [consistency, setConsistency] = useState('all')
  const [paymentStatus, setPaymentStatus] = useState('all')
  const [method, setMethod] = useState('all')

  const filtered = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    return data.filter((u) => {
      if (q && !(u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))) {
        return false
      }
      if (loginType !== 'all' && u.loginType !== loginType) return false
      if (predictions !== 'all' && u.hasPredictions !== (predictions === 'yes')) return false
      if (consistency !== 'all' && u.consistency !== consistency) return false
      if (paymentStatus !== 'all' && u.paymentStatus !== paymentStatus) return false
      if (method !== 'all' && !u.paymentMethods.includes(method)) return false
      return true
    })
  }, [data, query, loginType, predictions, consistency, paymentStatus, method])

  const { sorted, sort } = useSort(filtered, userSortValue, 'name')

  const methodOptions = useMemo<readonly FilterOption[]>(
    () => (methods ?? []).map((m) => ({ value: m.label, label: m.label })),
    [methods],
  )

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }
  if (error) return <Alert severity="error">{extractError(error)}</Alert>

  return (
    <Stack spacing={2} sx={{ height: '100%', p: 3 }}>
      <Box sx={{ flexShrink: 0 }}>
        <SectionTitle>Usuarios ({filtered.length})</SectionTitle>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mt: 1 }}>
          <TextField
            size="small"
            placeholder="Buscar por nombre o correo"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ width: 260, '& .MuiInputBase-input': { fontSize: 14 } }}
          />
          <FilterSelect label="Acceso" value={loginType} onChange={setLoginType} options={LOGIN_TYPE_OPTIONS} />
          <FilterSelect label="Predicciones" value={predictions} onChange={setPredictions} options={PREDICTION_OPTIONS} />
          <FilterSelect label="Consistencia" value={consistency} onChange={setConsistency} options={CONSISTENCY_OPTIONS} />
          <FilterSelect label="Pago" value={paymentStatus} onChange={setPaymentStatus} options={PAYMENT_STATUS_OPTIONS} />
          <FilterSelect label="Método" value={method} onChange={setMethod} options={methodOptions} />
        </Box>
      </Box>
      <TableContainer component={Paper} sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <SortCell label="ID" sortKey="userId" sort={sort} />
              <SortCell label="Nombre" sortKey="name" sort={sort} />
              <SortCell label="Correo" sortKey="email" sort={sort} />
              <SortCell label="Acceso" sortKey="loginType" sort={sort} />
              <SortCell label="Predicciones" sortKey="hasPredictions" sort={sort} />
              <SortCell label="Consistencia" sortKey="consistency" sort={sort} />
              <SortCell label="Pago" sortKey="paymentStatus" sort={sort} />
              <SortCell label="Métodos" sortKey="paymentMethods" sort={sort} />
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((u) => (
              <TableRow
                key={u.userId}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/users/${u.userId}`)}
              >
                <TableCell>{u.userId}</TableCell>
                <TableCell>{u.name || '—'}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <LoginTypeChip type={u.loginType} />
                </TableCell>
                <TableCell>{u.hasPredictions ? 'Sí' : 'No'}</TableCell>
                <TableCell>
                  <ConsistencyChip status={u.consistency} />
                </TableCell>
                <TableCell>
                  <PaymentChip status={u.paymentStatus} />
                </TableCell>
                <TableCell>{u.paymentMethods.join(', ') || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )
}
