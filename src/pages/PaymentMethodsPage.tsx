import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
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
import DeleteIcon from '@mui/icons-material/Delete'
import { useCreatePaymentMethod, useDeletePaymentMethod, usePaymentMethods } from '../api/hooks'
import { extractError } from '../api/client'

export function PaymentMethodsPage() {
  const { data, isLoading, error } = usePaymentMethods()
  const create = useCreatePaymentMethod()
  const remove = useDeletePaymentMethod()
  const [name, setName] = useState('')

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }
  if (error) return <Alert severity="error">{extractError(error)}</Alert>

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    create.mutate(name.trim().toUpperCase(), { onSuccess: () => setName('') })
  }

  return (
    <Stack spacing={2} sx={{ maxWidth: 560 }}>
      <Typography variant="h5">Métodos de pago</Typography>

      <Box component="form" onSubmit={onAdd} sx={{ display: 'flex', gap: 1 }}>
        <TextField
          size="small"
          label="Nuevo método"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ flexGrow: 1 }}
        />
        <Button type="submit" variant="contained" disabled={create.isPending}>
          Agregar
        </Button>
      </Box>
      {create.isError && <Alert severity="error">{extractError(create.error)}</Alert>}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.map((m) => (
              <TableRow key={m.paymentMethodId} hover>
                <TableCell>{m.paymentMethodId}</TableCell>
                <TableCell>{m.name}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="error"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(m.paymentMethodId)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )
}
