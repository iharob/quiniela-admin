import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
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
import SyncIcon from '@mui/icons-material/Sync'
import EditIcon from '@mui/icons-material/Edit'
import { useGames, useSetGameScore, useSyncGameScore } from '../api/hooks'
import { extractError } from '../api/client'
import { SectionTitle } from '../components/SectionTitle'
import type { AdminGame } from '../api/types'

export function GamesPage(): JSX.Element {
  const { data, isLoading, error } = useGames()
  const sync = useSyncGameScore()
  const [editing, setEditing] = useState<AdminGame | null>(null)
  const [toast, setToast] = useState('')

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }
  if (error) return <Alert severity="error">{extractError(error)}</Alert>

  const onSync = (g: AdminGame): void => {
    sync.mutate(g.gameId, {
      onSuccess: (res) =>
        setToast(res.applied ? 'Marcador sincronizado.' : res.message || 'Sin cambios.'),
      onError: (err) => setToast(extractError(err)),
    })
  }

  return (
    <Stack spacing={2} sx={{ height: '100%' }}>
      <SectionTitle>Partidos ({data?.length ?? 0})</SectionTitle>
      <TableContainer component={Paper} sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Ronda</TableCell>
              <TableCell>Inicio</TableCell>
              <TableCell>Local</TableCell>
              <TableCell align="center">Marcador</TableCell>
              <TableCell>Visitante</TableCell>
              <TableCell>Ganador</TableCell>
              <TableCell>Fixture ext.</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.map((g) => (
              <TableRow key={g.gameId} hover>
                <TableCell>{g.gameId}</TableCell>
                <TableCell>{g.round}</TableCell>
                <TableCell>{new Date(g.startsAt).toLocaleString()}</TableCell>
                <TableCell>{g.team1Name || g.team1 || '—'}</TableCell>
                <TableCell align="center">
                  {g.team1Score ?? '–'} : {g.team2Score ?? '–'}
                </TableCell>
                <TableCell>{g.team2Name || g.team2 || '—'}</TableCell>
                <TableCell>{g.winner || '—'}</TableCell>
                <TableCell>{g.externalGameId ?? '—'}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Editar marcador">
                    <IconButton size="small" onClick={() => setEditing(g)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={g.externalGameId ? 'Sincronizar marcador en vivo' : 'Sin fixture externo'}>
                    <span>
                      <IconButton
                        size="small"
                        disabled={!g.externalGameId || sync.isPending}
                        onClick={() => onSync(g)}
                      >
                        <SyncIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {editing && <ScoreDialog game={editing} onClose={() => setEditing(null)} />}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast('')}
        message={toast}
      />
    </Stack>
  )
}

function ScoreDialog({
  game,
  onClose,
}: {
  readonly game: AdminGame
  readonly onClose: () => void
}): JSX.Element {
  const setScore = useSetGameScore()
  const [t1, setT1] = useState(String(game.team1Score ?? 0))
  const [t2, setT2] = useState(String(game.team2Score ?? 0))
  const [winner, setWinner] = useState(game.winner ?? '')

  const onSave = (): void => {
    setScore.mutate(
      {
        gameId: game.gameId,
        team1Score: Number(t1),
        team2Score: Number(t2),
        winner,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>
        Marcador — {game.team1Name || game.team1} vs {game.team2Name || game.team2}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {setScore.isError && <Alert severity="error">{extractError(setScore.error)}</Alert>}
          <TextField
            label={`${game.team1Name || game.team1}`}
            type="number"
            value={t1}
            onChange={(e) => setT1(e.target.value)}
          />
          <TextField
            label={`${game.team2Name || game.team2}`}
            type="number"
            value={t2}
            onChange={(e) => setT2(e.target.value)}
          />
          <TextField
            label="Ganador (código de equipo, opcional)"
            value={winner}
            onChange={(e) => setWinner(e.target.value)}
            helperText="Para desempates; dejar vacío si el marcador define al ganador."
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={onSave} disabled={setScore.isPending}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
