import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import { useSettings, useUpdateSettings } from '../api/hooks'
import { extractError } from '../api/client'

export function SettingsDialog({ onClose }: { readonly onClose: () => void }): JSX.Element {
  const { data: settings, isLoading } = useSettings()
  const update = useUpdateSettings()
  const [fee, setFee] = useState('')

  useEffect(() => {
    if (settings) setFee(String(settings.entryFeeUsd))
  }, [settings])

  const onSave = (): void => {
    update.mutate({ entryFeeUsd: Number(fee) || 0 }, { onSuccess: onClose })
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Ajustes</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <CircularProgress size={24} />
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            {update.isError && <Alert severity="error">{extractError(update.error)}</Alert>}
            <TextField
              label="Cuota por participante (USD)"
              type="number"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              size="small"
              fullWidth
              helperText="Base para el total esperado y lo que falta por cobrar."
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={onSave} disabled={update.isPending}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
