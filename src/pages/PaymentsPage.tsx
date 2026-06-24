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
  ListSubheader,
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
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
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
import { SectionTitle } from '../components/SectionTitle'
import { SortCell, useSort, type SortValue } from '../components/sort'
import type { Currency, LinkedPaymentStatus, Payment } from '../api/types'

function formatAmount(p: Payment): string {
  if (p.amount == null) return '—'
  return `${p.amount.toFixed(2)} ${p.currency}`
}

// EllipsisCell keeps long text (payer, beneficiaries, reference…) on a single
// line and truncates with an ellipsis instead of wrapping the row. The full
// value stays available via the native tooltip.
function EllipsisCell({ text, max }: { readonly text: string; readonly max: number }): JSX.Element {
  return (
    <TableCell
      title={text}
      sx={{ maxWidth: max, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
    >
      {text}
    </TableCell>
  )
}

function paymentSortValue(p: Payment, key: string): SortValue {
  switch (key) {
    case 'paymentId':
      return p.paymentId
    case 'payerName':
      return p.payerName
    case 'beneficiaries':
      return p.beneficiaries.map((b) => b.name).join(', ')
    case 'amount':
      return p.amount ?? null
    case 'paymentMethodLabel':
      return p.paymentMethodLabel
    case 'reference':
      return p.reference
    case 'status':
      return p.status
    default:
      return undefined
  }
}

export function PaymentsPage(): JSX.Element {
  const { data, isLoading, error } = usePayments()
  const del = useDeletePayment()
  const update = useUpdatePayment()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Payment | null>(null)
  const { sorted, sort } = useSort(data ?? [], paymentSortValue, 'paymentId', 'desc')
  const closeDialog = (): void => {
    setAdding(false)
    setEditing(null)
  }

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
    <Stack spacing={2} sx={{ height: '100%', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <SectionTitle>Pagos ({data?.length ?? 0})</SectionTitle>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAdding(true)}>
          Nuevo pago
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <SortCell label="ID" sortKey="paymentId" sort={sort} />
              <SortCell label="Pagador" sortKey="payerName" sort={sort} />
              <SortCell label="Cubre a" sortKey="beneficiaries" sort={sort} />
              <SortCell label="Monto" sortKey="amount" sort={sort} />
              <SortCell label="Método" sortKey="paymentMethodLabel" sort={sort} />
              <SortCell label="Referencia" sortKey="reference" sort={sort} />
              <SortCell label="Estado" sortKey="status" sort={sort} />
              <TableCell>Comprobante</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((p) => (
              <TableRow key={p.paymentId} hover>
                <TableCell>{p.paymentId}</TableCell>
                <EllipsisCell text={p.payerName} max={160} />
                <EllipsisCell text={p.beneficiaries.map((b) => b.name).join(', ')} max={240} />
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatAmount(p)}</TableCell>
                <EllipsisCell text={p.paymentMethodLabel || '—'} max={140} />
                <EllipsisCell text={p.reference || '—'} max={160} />
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
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => setEditing(p)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
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

      {(adding || editing !== null) && <PaymentDialog payment={editing} onClose={closeDialog} />}
    </Stack>
  )
}

function PaymentDialog({
  payment,
  onClose,
}: {
  readonly payment: Payment | null
  readonly onClose: () => void
}): JSX.Element {
  const { data: users } = useUsers()
  const { data: methods } = usePaymentMethods()
  const create = useCreatePayment()
  const update = useUpdatePayment()
  const uploadProof = useUploadPaymentProof()
  const isEdit = payment !== null

  // The dialog is mounted fresh on each open, so initialising from the payment
  // prop (edit) or empty (create) here needs no effect.
  const [payerUserId, setPayerUserId] = useState<number | ''>(payment?.payerUserId ?? '')
  const [beneficiaryIds, setBeneficiaryIds] = useState<number[]>(
    payment ? payment.beneficiaries.map((b) => b.userId) : [],
  )
  const [amount, setAmount] = useState(payment?.amount != null ? String(payment.amount) : '')
  const [currency, setCurrency] = useState<Currency>(payment?.currency ?? 'USD')
  const [methodId, setMethodId] = useState<number | ''>(payment?.paymentMethodId ?? '')
  const [reference, setReference] = useState(payment?.reference ?? '')
  const [notes, setNotes] = useState(payment?.notes ?? '')
  const [paidAt, setPaidAt] = useState(payment?.paidAt ? payment.paidAt.slice(0, 10) : '')
  const [status, setStatus] = useState<LinkedPaymentStatus>(payment?.status ?? 'PENDING')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [benSearch, setBenSearch] = useState('')

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
      const saved =
        payment !== null
          ? await update.mutateAsync({ paymentId: payment.paymentId, body })
          : await create.mutateAsync(body)
      // Uploading a new file replaces the proof; leaving it empty keeps any existing one.
      if (file) {
        await uploadProof.mutateAsync({ paymentId: saved.paymentId, file })
      }
      onClose()
    } catch (err) {
      setError(extractError(err))
    }
  }

  const userOptions = users ?? []
  // Beneficiaries are quiniela participants (have predictions); keep any
  // already-selected user too so they can still be unchecked. Then apply the
  // in-dropdown search.
  const benQuery = benSearch.trim().toLowerCase()
  const benOptions = userOptions
    .filter((u) => u.hasPredictions || beneficiaryIds.includes(u.userId))
    .filter(
      (u) =>
        benQuery === '' ||
        u.name.toLowerCase().includes(benQuery) ||
        u.email.toLowerCase().includes(benQuery),
    )

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Editar pago' : 'Nuevo pago'}</DialogTitle>
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
              MenuProps={{ autoFocus: false }}
              renderValue={(selected) =>
                userOptions
                  .filter((u) => (selected as number[]).includes(u.userId))
                  .map((u) => u.name || u.email)
                  .join(', ')
              }
            >
              <ListSubheader sx={{ p: 1, bgcolor: 'background.paper' }}>
                <TextField
                  size="small"
                  autoFocus
                  fullWidth
                  placeholder="Buscar participante"
                  value={benSearch}
                  onChange={(e) => setBenSearch(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </ListSubheader>
              {benOptions.map((u) => (
                <MenuItem key={u.userId} value={u.userId}>
                  <Checkbox checked={beneficiaryIds.includes(u.userId)} />
                  <ListItemText primary={u.name || u.email} />
                </MenuItem>
              ))}
              {benOptions.length === 0 && (
                <MenuItem disabled>Sin participantes</MenuItem>
              )}
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
                <MenuItem value="EUR">EUR</MenuItem>
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
            {file
              ? `Comprobante: ${file.name}`
              : isEdit && payment?.proofImageUrl
                ? 'Reemplazar comprobante (opcional)'
                : 'Adjuntar comprobante (opcional)'}
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
          disabled={create.isPending || update.isPending || uploadProof.isPending}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
