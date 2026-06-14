import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useNavigate, useParams } from 'react-router-dom'
import {
  usePaymentMethods,
  useUpsertUserPayment,
  useUserConsistency,
  useUserPayment,
  useUsers,
} from '../api/hooks'
import { extractError } from '../api/client'
import type { PaymentStatus } from '../api/types'
import { ConsistencyChip } from '../components/chips'

export function UserDetailPage(): JSX.Element {
  const { userId: userIdParam } = useParams()
  const userId = Number(userIdParam)
  const navigate = useNavigate()
  const { data: users } = useUsers()
  const user = users?.find((u) => u.userId === userId)

  return (
    <Stack spacing={2} sx={{ height: '100%', overflowY: 'auto' }}>
      <Box sx={{ flexShrink: 0 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/users')}>
          Volver
        </Button>
      </Box>
      <Typography variant="h5">{user?.name || user?.email || `Usuario ${userId}`}</Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Perfil
              </Typography>
              <Field label="ID" value={String(userId)} />
              <Field label="Nombre" value={user?.name || '—'} />
              <Field label="Correo" value={user?.email || '—'} />
              <Field label="Bio" value={user?.bio || '—'} />
              <Field label="Tipo de acceso" value={user?.loginType || '—'} />
              <Field label="Tiene predicciones" value={user?.hasPredictions ? 'Sí' : 'No'} />
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pago
              </Typography>
              <PaymentEditor userId={userId} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Consistencia de la quiniela
              </Typography>
              <ConsistencyPanel userId={userId} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}

function Field({ label, value }: { readonly label: string; readonly value: string }): JSX.Element {
  return (
    <Box sx={{ display: 'flex', py: 0.5 }}>
      <Typography variant="body2" sx={{ width: 160, color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  )
}

function ConsistencyPanel({ userId }: { readonly userId: number }): JSX.Element | null {
  const { data, isLoading, error } = useUserConsistency(userId)
  if (isLoading) return <CircularProgress size={24} />
  if (error) return <Alert severity="error">{extractError(error)}</Alert>
  if (!data) return null

  if (data.status === 'NO_PREDICTIONS') {
    return <Alert severity="info">Este usuario no tiene predicciones.</Alert>
  }

  const c = data.consistency?.counts
  const games = (data.consistency?.games ?? []).filter((g) => g.class !== 'EXACT')
  const prop = data.consistency?.propagation ?? []

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <ConsistencyChip status={data.status} />
        {c && (
          <>
            <Chip size="small" label={`Exactos: ${c.exact}`} />
            <Chip size="small" color="error" label={`Reales: ${c.real}`} />
            <Chip size="small" label={`Empates: ${c.tie}`} />
            <Chip size="small" label={`Invertidos: ${c.swapped}`} />
            <Chip size="small" label={`Faltantes: ${c.missing}`} />
            <Chip size="small" color={c.propBroken > 0 ? 'error' : 'default'} label={`Prop. rotas: ${c.propBroken}`} />
          </>
        )}
      </Box>

      {data.error && <Alert severity="warning">{data.error}</Alert>}

      {games.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Round of 32 / clasificación
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Juego</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Esperado</TableCell>
                <TableCell>Predicho</TableCell>
                <TableCell>Motivo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {games.map((g, i) => (
                <TableRow key={`${g.gameId ?? 'set'}-${i}`}>
                  <TableCell>{g.gameId || '—'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={g.class === 'REAL' ? 'error' : 'default'}
                      label={g.class}
                    />
                  </TableCell>
                  <TableCell>{g.expected ? `${g.expected[0]} vs ${g.expected[1]}` : '—'}</TableCell>
                  <TableCell>{g.stored ? `${g.stored[0]} vs ${g.stored[1]}` : '—'}</TableCell>
                  <TableCell>{g.reason || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {prop.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Propagación (Round of 16 → final)
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Juego</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Esperado</TableCell>
                <TableCell>Predicho</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {prop.map((p, i) => (
                <TableRow key={`${p.gameId}-${i}`}>
                  <TableCell>{p.gameId}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={p.class === 'PROP_BROKEN' ? 'error' : 'default'}
                      label={p.class}
                    />
                  </TableCell>
                  <TableCell>{p.expected ? `${p.expected[0]} vs ${p.expected[1]}` : '—'}</TableCell>
                  <TableCell>{p.stored ? `${p.stored[0]} vs ${p.stored[1]}` : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {games.length === 0 && prop.length === 0 && (
        <Alert severity="success">Sin hallazgos: la quiniela es consistente.</Alert>
      )}
    </Stack>
  )
}

const STATUSES: PaymentStatus[] = ['UNPAID', 'PENDING', 'VERIFIED']

function PaymentEditor({ userId }: { readonly userId: number }): JSX.Element {
  const { data: payment, isLoading } = useUserPayment(userId)
  const { data: methods } = usePaymentMethods()
  const upsert = useUpsertUserPayment(userId)

  const [status, setStatus] = useState<PaymentStatus>('UNPAID')
  const [contact, setContact] = useState('')
  const [notes, setNotes] = useState('')
  const [methodIds, setMethodIds] = useState<number[]>([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (payment) {
      setStatus(payment.status)
      setContact(payment.contact)
      setNotes(payment.notes)
      setMethodIds([...payment.methodIds])
    }
  }, [payment])

  if (isLoading) return <CircularProgress size={24} />

  const onSave = (): void => {
    setSaved(false)
    upsert.mutate(
      { status, contact, notes, methodIds },
      { onSuccess: () => setSaved(true) },
    )
  }

  return (
    <Stack spacing={2}>
      <FormControl size="small" fullWidth>
        <InputLabel>Estado</InputLabel>
        <Select
          label="Estado"
          value={status}
          onChange={(e) => setStatus(e.target.value as PaymentStatus)}
        >
          {STATUSES.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" fullWidth>
        <InputLabel>Métodos de pago</InputLabel>
        <Select
          multiple
          label="Métodos de pago"
          value={methodIds}
          onChange={(e) => setMethodIds(e.target.value as number[])}
          input={<OutlinedInput label="Métodos de pago" />}
          renderValue={(selected) =>
            (methods ?? [])
              .filter((m) => (selected as number[]).includes(m.paymentMethodId))
              .map((m) => m.label)
              .join(', ')
          }
        >
          {(methods ?? []).map((m) => (
            <MenuItem key={m.paymentMethodId} value={m.paymentMethodId}>
              <Checkbox checked={methodIds.includes(m.paymentMethodId)} />
              <ListItemText primary={m.label} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        size="small"
        label="Contacto de pago (opcional)"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
      />
      <TextField
        size="small"
        label="Notas"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        multiline
        minRows={2}
      />

      {payment?.verifiedAt && (
        <Typography variant="caption" color="text.secondary">
          Verificado: {new Date(payment.verifiedAt).toLocaleString()}
        </Typography>
      )}

      <Divider />
      {upsert.isError && <Alert severity="error">{extractError(upsert.error)}</Alert>}
      {saved && <Alert severity="success">Guardado.</Alert>}
      <Button variant="contained" onClick={onSave} disabled={upsert.isPending}>
        Guardar pago
      </Button>
    </Stack>
  )
}
