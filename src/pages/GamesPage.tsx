import { useState } from 'react'
import {
  Alert,
  Box,
  CircularProgress,
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
  Tooltip,
} from '@mui/material'
import SyncIcon from '@mui/icons-material/Sync'
import { useGames, useSyncGameScore } from '../api/hooks'
import { extractError } from '../api/client'
import { SectionTitle } from '../components/SectionTitle'
import { SortCell, useSort, type SortValue } from '../components/sort'
import type { AdminGame } from '../api/types'

function gameSortValue(g: AdminGame, key: string): SortValue {
  switch (key) {
    case 'gameId':
      return g.gameId
    case 'round':
      return g.round
    case 'startsAt':
      return g.startsAt
    case 'team1Name':
      return g.team1Name || g.team1
    case 'team2Name':
      return g.team2Name || g.team2
    case 'winner':
      return g.winner
    case 'externalGameId':
      return g.externalGameId ?? null
    default:
      return undefined
  }
}

export function GamesPage(): JSX.Element {
  const { data, isLoading, error } = useGames()
  const sync = useSyncGameScore()
  const [toast, setToast] = useState('')
  const { sorted, sort } = useSort(data ?? [], gameSortValue, 'startsAt')

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
    <Stack spacing={2} sx={{ height: '100%', p: 3 }}>
      <SectionTitle>Partidos ({data?.length ?? 0})</SectionTitle>
      <TableContainer component={Paper} sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <SortCell label="ID" sortKey="gameId" sort={sort} />
              <SortCell label="Ronda" sortKey="round" sort={sort} />
              <SortCell label="Inicio" sortKey="startsAt" sort={sort} />
              <SortCell label="Local" sortKey="team1Name" sort={sort} />
              <TableCell align="center">Marcador</TableCell>
              <SortCell label="Visitante" sortKey="team2Name" sort={sort} />
              <SortCell label="Ganador" sortKey="winner" sort={sort} />
              <SortCell label="Fixture ext." sortKey="externalGameId" sort={sort} />
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((g) => (
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

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast('')}
        message={toast}
      />
    </Stack>
  )
}
