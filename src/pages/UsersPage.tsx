import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useUsers } from '../api/hooks'
import { extractError } from '../api/client'
import { ConsistencyChip, LoginTypeChip, PaymentChip } from '../components/chips'

export function UsersPage(): JSX.Element {
  const navigate = useNavigate()
  const { data, isLoading, error } = useUsers()
  const [filter, setFilter] = useState('')

  const filtered = useMemo(() => {
    if (!data) return []
    const q = filter.trim().toLowerCase()
    if (!q) return data
    return data.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    )
  }, [data, filter])

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }
  if (error) return <Alert severity="error">{extractError(error)}</Alert>

  return (
    <Stack spacing={2} sx={{ height: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <Typography variant="h5">Usuarios ({data?.length ?? 0})</Typography>
        <TextField
          size="small"
          placeholder="Buscar por nombre o correo"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ width: 320 }}
        />
      </Box>
      <TableContainer component={Paper} sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Correo</TableCell>
              <TableCell>Acceso</TableCell>
              <TableCell>Predicciones</TableCell>
              <TableCell>Consistencia</TableCell>
              <TableCell>Pago</TableCell>
              <TableCell>Métodos</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((u) => (
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
