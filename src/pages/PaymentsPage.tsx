import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  Link,
  ListItemText,
  MenuItem,
  OutlinedInput,
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
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import {
  useCreatePayment,
  useDeletePayment,
  usePaymentMethods,
  usePayments,
  useUpdatePayment,
  useUploadPaymentProof,
  type PaymentRequestBody,
} from '../api/hooks'
import { useUsers } from '../api/hooks'
import { extractError } from '../api/client'
import type { Currency, LinkedPaymentStatus, Payment } from '../api/types'

function formatAmount(p: Payment): string {
  if (p.amount == null) return '—'
  return `${p.amount.toFixed(2)} ${p.currency}`
}

export function PaymentsPage(): JSX.Element {
  const { data, isLoading, error } = usePayments()
  const del = useDeletePayment()
  const update = useUpdatePayment()
  const [adding, setAdding] = useState(false)

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }
  if (error) return <Alert severity="error">{extractError(error)}</Alert>

  const verify = (p: Payment): void => {
    const body: PaymentRequestBody = {
      payerUserId: p.payerUserId,
      paymentMethodId: p.paymentMethodId ?? null,
      amount: p.amount ?? null,
      currency: p.currency,
      reference: p.reference,
      notes: p.notes,
      paidAt: p.paidAt ?? null,
      status: 'VERIFIED',
      beneficiaryUserIds: p.beneficiaries.map((b) => b.userId),
    }
    update.mutate({ paymentId: p.paymentId, body })
  }

  return (
    <Stack spacing={2} sx={{ height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <Typography variant="h5">Pagos ({data?.length ?? 0})</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAdding(true)}>
          Nuevo pago
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Pagador</TableCell>
              <TableCell>Cubre a</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Método</TableCell>
              <TableCell>Referencia</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Comprobante</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.map((p) => (
              <TableRow key={p.paymentId} hover>
                <TableCell>{p.paymentId}</TableCell>
                <TableCell>{p.payerName}</TableCell>
                <TableCell>{p.beneficiaries.map((b) => b.name).join(', ')}</TableCell>
                <TableCell>{formatAmount(p)}</TableCell>
                <TableCell>{p.paymentMethodLabel || '—'}</TableCell>
                <TableCell>{p.reference || '—'}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    color={p.status === 'VERIFIED' ? 'success' : 'warning'}
                    label={p.status === 'VERIFIED' ? 'Verificado' : 'Pendiente'}
                  />
                </TableCell>
                <TableCell>
                  {p.proofImageUrl ? (
                    <Link href={p.proofImageUrl} target="_blank" rel="noopener">
                      ver
                    </Link>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell align="right">
                  {p.status !== 'VERIFIED' && (
                    <Tooltip title="Marcar como verificado">
                      <span>
                        <IconButton
                          size="small"
                          color="success"
                          disabled={update.isPending}
                          onClick={() => verify(p)}
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                  <Tooltip title="Eliminar">
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={del.isPending}
                        onClick={() => del.mutate(p.paymentId)}
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

      {adding && <PaymentDialog onClose={() => setAdding(false)} />}
    </Stack>
  )
}

function PaymentDialog({ onClose }: { readonly onClose: () => void }): JSX.Element {
  const { data: users } = useUsers()
  const { data: methods } = usePaymentMethods()
  const create = useCreatePayment()
  const uploadProof = useUploadPaymentProof()

  const [payerUserId, setPayerUserId] = useState<number | ''>('')
  const [beneficiaryIds, setBeneficiaryIds] = useState<number[]>([])
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('USD')
  const [methodId, setMethodId] = useState<number | ''>('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [paidAt, setPaidAt] = useState('')
  const [status, setStatus] = useState<LinkedPaymentStatus>('PENDING')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')

  const onSubmit = async (): Promise<void> => {
    if (payerUserId === '') {
      setError('Selecciona quién pagó.')
      return
    }
    setError('')
    const body: PaymentRequestBody = {
      payerUserId,
      paymentMethodId: methodId === '' ? null : methodId,
      amount: amount.trim() === '' ? null : Number(amount),
      currency,
      reference: reference.trim(),
      notes: notes.trim(),
      paidAt: paidAt === '' ? null : new Date(paidAt).toISOString(),
      status,
      // Default to covering the payer if no beneficiaries were picked.
      beneficiaryUserIds: beneficiaryIds.length > 0 ? beneficiaryIds : [payerUserId],
    }
    try {
      const created = await create.mutateAsync(body)
      if (file) {
        await uploadProof.mutateAsync({ paymentId: created.paymentId, file })
      }
      onClose()
    } catch (err) {
      setError(extractError(err))
    }
  }

  const userOptions = users ?? []

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Nuevo pago</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <FormControl size="small" fullWidth>
            <InputLabel>Pagador</InputLabel>
            <Select
              label="Pagador"
              value={payerUserId}
              onChange={(e) => setPayerUserId(e.target.value === '' ? '' : Number(e.target.value))}
            >
              {userOptions.map((u) => (
                <MenuItem key={u.userId} value={u.userId}>
                  {u.name || u.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel>Cubre a (beneficiarios)</InputLabel>
            <Select
              multiple
              label="Cubre a (beneficiarios)"
              value={beneficiaryIds}
              onChange={(e) => setBeneficiaryIds(e.target.value as number[])}
              input={<OutlinedInput label="Cubre a (beneficiarios)" />}
              renderValue={(selected) =>
                userOptions
                  .filter((u) => (selected as number[]).includes(u.userId))
                  .map((u) => u.name || u.email)
                  .join(', ')
              }
            >
              {userOptions.map((u) => (
                <MenuItem key={u.userId} value={u.userId}>
                  <Checkbox checked={beneficiaryIds.includes(u.userId)} />
                  <ListItemText primary={u.name || u.email} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              label="Monto"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              sx={{ flex: 1 }}
            />
            <FormControl size="small" sx={{ width: 120 }}>
              <InputLabel>Moneda</InputLabel>
              <Select
                label="Moneda"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
              >
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="VES">VES</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <FormControl size="small" fullWidth>
            <InputLabel>Método</InputLabel>
            <Select
              label="Método"
              value={methodId}
              onChange={(e) => setMethodId(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <MenuItem value="">
                <em>Ninguno</em>
              </MenuItem>
              {(methods ?? []).map((m) => (
                <MenuItem key={m.paymentMethodId} value={m.paymentMethodId}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Referencia"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
          <TextField
            size="small"
            label="Fecha del pago"
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            label="Notas"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            minRows={2}
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Estado</InputLabel>
            <Select
              label="Estado"
              value={status}
              onChange={(e) => setStatus(e.target.value as LinkedPaymentStatus)}
            >
              <MenuItem value="PENDING">Pendiente</MenuItem>
              <MenuItem value="VERIFIED">Verificado</MenuItem>
            </Select>
          </FormControl>

          <Button component="label" variant="outlined">
            {file ? `Comprobante: ${file.name}` : 'Adjuntar comprobante (opcional)'}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={create.isPending || uploadProof.isPending}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
