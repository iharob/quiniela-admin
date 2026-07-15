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
  Tooltip,
  Typography,
} from '@mui/material'
import { useRankings } from '../api/hooks'
import { extractError } from '../api/client'
import { EliminationChip } from '../components/chips'
import { SectionTitle } from '../components/SectionTitle'
import { SortCell, useSort, type SortValue } from '../components/sort'
import type { AdminRankingEntry } from '../api/types'

function rankingSortValue(r: AdminRankingEntry, key: string): SortValue {
  switch (key) {
    case 'rank':
      return r.currentRank
    case 'name':
      return r.userName
    case 'score':
      return r.currentScore
    case 'dream':
      return r.dreamScore
    case 'bestPosition':
      return r.bestPosition
    case 'eliminated':
      return r.eliminated
    case 'leader':
      return r.leaderName
    default:
      return undefined
  }
}

export function RankingsPage(): JSX.Element {
  const { data, isLoading, error } = useRankings()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    if (!q) return data
    return data.filter((r) => r.userName.toLowerCase().includes(q))
  }, [data, query])

  const { sorted, sort } = useSort(filtered, rankingSortValue, 'rank')

  const eliminatedCount = useMemo(() => (data ?? []).filter((r) => r.eliminated).length, [data])

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
        <SectionTitle>
          Clasificación ({filtered.length}) · {eliminatedCount} eliminados
        </SectionTitle>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Eliminado = aunque acierte todas sus predicciones restantes, otro participante
          sigue quedando primero. Mejor posición = el mejor puesto que aún puede alcanzar
          si acierta todo lo que le queda.
        </Typography>
        <Box sx={{ mt: 1 }}>
          <TextField
            size="small"
            placeholder="Buscar por nombre"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ width: 260, '& .MuiInputBase-input': { fontSize: 14 } }}
          />
        </Box>
      </Box>
      <TableContainer component={Paper} sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <SortCell label="#" sortKey="rank" sort={sort} align="right" />
              <SortCell label="Participante" sortKey="name" sort={sort} />
              <SortCell label="Puntos" sortKey="score" sort={sort} align="right" />
              <SortCell label="Máx. alcanzable" sortKey="dream" sort={sort} align="right" />
              <SortCell label="Mejor posición" sortKey="bestPosition" sort={sort} align="right" />
              <SortCell label="Estado" sortKey="eliminated" sort={sort} />
              <SortCell label="Líder en su mejor caso" sortKey="leader" sort={sort} />
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((r) => (
              <TableRow key={r.userID} hover>
                <TableCell align="right">{r.currentRank}</TableCell>
                <TableCell>{r.userName || '—'}</TableCell>
                <TableCell align="right">{r.currentScore}</TableCell>
                <TableCell align="right">{r.dreamScore}</TableCell>
                <TableCell align="right">{r.eliminated ? `${r.bestPosition}º` : '—'}</TableCell>
                <TableCell>
                  <EliminationChip eliminated={r.eliminated} />
                </TableCell>
                <TableCell>
                  {r.eliminated ? (
                    <Tooltip title={`${r.leaderName} alcanza ${r.leaderScore} en el mejor mundo de ${r.userName}`}>
                      <span>
                        {r.leaderName} · {r.leaderScore}
                      </span>
                    </Tooltip>
                  ) : (
                    '—'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )
}
