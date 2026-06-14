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
  Tooltip,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { useCreatePaymentMethod, useDeletePaymentMethod, usePaymentMethods } from '../api/hooks'
import { extractError } from '../api/client'
import { SectionTitle } from '../components/SectionTitle'
import { SortCell, useSort, type SortValue } from '../components/sort'
import type { PaymentMethod } from '../api/types'

function methodSortValue(m: PaymentMethod, key: string): SortValue {
  switch (key) {
    case 'paymentMethodId':
      return m.paymentMethodId
    case 'label':
      return m.label
    default:
      return undefined
  }
}

export function PaymentMethodsPage(): JSX.Element {
  const { data, isLoading, error } = usePaymentMethods()
  const create = useCreatePaymentMethod()
  const remove = useDeletePaymentMethod()
  const [label, setLabel] = useState('')
  const { sorted, sort } = useSort(data ?? [], methodSortValue, 'label')

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }
  if (error) return <Alert severity="error">{extractError(error)}</Alert>

  const onAdd = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!label.trim()) return
    create.mutate(label.trim(), { onSuccess: () => setLabel('') })
  }

  return (
    <Stack spacing={2} sx={{ height: '100%', maxWidth: 640 }}>
      <SectionTitle>Métodos de pago</SectionTitle>

      <Box component="form" onSubmit={onAdd} sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
        <TextField
          size="small"
          label="Nombre del método (p. ej. Pago Móvil)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          sx={{ flexGrow: 1 }}
        />
        <Button type="submit" variant="contained" disabled={create.isPending}>
          Agregar
        </Button>
      </Box>
      {create.isError && <Alert severity="error">{extractError(create.error)}</Alert>}

      <TableContainer component={Paper} sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <SortCell label="ID" sortKey="paymentMethodId" sort={sort} />
              <SortCell label="Nombre" sortKey="label" sort={sort} />
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((m) => (
              <TableRow key={m.paymentMethodId} hover>
                <TableCell>{m.paymentMethodId}</TableCell>
                <TableCell>
                  {m.label}
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {m.name}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Eliminar">
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={remove.isPending}
                        onClick={() => remove.mutate(m.paymentMethodId)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )
}
