import { Alert, Box, Button, Card, CardContent, CircularProgress, Divider, Stack, Typography } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useResults } from '../api/hooks'
import { extractError } from '../api/client'
import { SectionTitle } from '../components/SectionTitle'
import { flagEmoji } from '../utils/flag'
import type {
  ResultsGroup,
  ResultsGroupGame,
  ResultsMatch,
  ResultsRound,
  ResultsSlot,
  ResultsStandingRow,
  ResultsTeam,
} from '../api/types'

// Knockout rounds in the games-table numbering used by the backend
// (2 = round of 32 … 6 = final).
const ROUND_LABELS: Readonly<Record<number, string>> = {
  2: 'Dieciseisavos',
  3: 'Octavos',
  4: 'Cuartos',
  5: 'Semifinales',
  6: 'Final',
}

// ResultsPage renders the tournament's real results — group standings and
// fixtures plus the knockout bracket — from the JSON served at
// GET /admin/results/json. It is recomputed from the live games table on every
// request, so "Actualizar" always shows the latest scores, standings, and the
// provisional bracket projection.
export function ResultsPage(): JSX.Element {
  const { data, isLoading, error, refetch, isFetching } = useResults()

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }
  if (error) return <Alert severity="error">{extractError(error)}</Alert>
  if (!data) return <Alert severity="info">Sin datos.</Alert>

  return (
    <Stack spacing={3} sx={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <SectionTitle>Resultados</SectionTitle>
        <Button startIcon={<RefreshIcon />} onClick={() => void refetch()} disabled={isFetching}>
          Actualizar
        </Button>
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
          Fase de grupos
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          * Mejores 8 terceros (clasificación provisional)
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 2,
            alignItems: 'start',
          }}
        >
          {data.groups.map((group) => (
            <GroupCard key={group.name} group={group} />
          ))}
        </Box>
      </Box>

      {data.rounds.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
            Eliminatorias
          </Typography>
          {data.legend && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              {data.legend}
            </Typography>
          )}
          <Box sx={{ overflowX: 'auto', pb: 1 }}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'stretch', minWidth: 'min-content' }}>
              {data.rounds.map((round) => (
                <BracketColumn key={round.round} round={round} />
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Stack>
  )
}

function GroupCard({ group }: { readonly group: ResultsGroup }): JSX.Element {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Grupo {group.name}
        </Typography>
        <StandingsTable rows={group.standings} />
        {group.games.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Stack spacing={0.25}>
              {group.games.map((game, idx) => (
                <FixtureRow key={idx} game={game} />
              ))}
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function StandingsTable({ rows }: { readonly rows: readonly ResultsStandingRow[] }): JSX.Element {
  return (
    <Box
      component="table"
      sx={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: 12,
        '& th, & td': { py: 0.25, px: 0.5, textAlign: 'right', whiteSpace: 'nowrap' },
        '& th:nth-of-type(2), & td:nth-of-type(2)': { textAlign: 'left', width: '100%' },
        '& th': { color: 'text.secondary', fontWeight: 600 },
      }}
    >
      <thead>
        <tr>
          <th>#</th>
          <th>Equipo</th>
          <th>PJ</th>
          <th>Pts</th>
          <th>GF</th>
          <th>GC</th>
          <th>DG</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <Box
            component="tr"
            key={row.team.country || row.rank}
            sx={row.bestThird ? { bgcolor: 'action.hover' } : undefined}
          >
            <td>{row.rank}</td>
            <td>
              <TeamLabel team={row.team} />
              {row.bestThird && ' *'}
            </td>
            <td>{row.played}</td>
            <td style={{ fontWeight: 700 }}>{row.points}</td>
            <td>{row.goalsFor}</td>
            <td>{row.goalsAgainst}</td>
            <td>{formatGoalDiff(row.goalDiff)}</td>
          </Box>
        ))}
      </tbody>
    </Box>
  )
}

function FixtureRow({ game }: { readonly game: ResultsGroupGame }): JSX.Element {
  const played = game.team1Score !== null && game.team2Score !== null
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 12 }}>
      <Box sx={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
        <TeamLabel team={game.team1} reverse />
      </Box>
      <Box sx={{ minWidth: 36, textAlign: 'center', color: played ? 'text.primary' : 'text.disabled' }}>
        {played ? `${game.team1Score}-${game.team2Score}` : 'vs'}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <TeamLabel team={game.team2} />
      </Box>
    </Box>
  )
}

function BracketColumn({ round }: { readonly round: ResultsRound }): JSX.Element {
  return (
    <Stack spacing={1.5} sx={{ justifyContent: 'space-around', minWidth: 200 }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
        {ROUND_LABELS[round.round] ?? `Ronda ${round.round}`}
      </Typography>
      {round.matches.map((match) => (
        <MatchCard key={match.gameId} match={match} />
      ))}
    </Stack>
  )
}

function MatchCard({ match }: { readonly match: ResultsMatch }): JSX.Element {
  const winner = match.winner?.country
  return (
    <Card variant="outlined" sx={{ flexShrink: 0 }}>
      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
        <SlotRow slot={match.team1} isWinner={Boolean(winner) && match.team1.team.country === winner} />
        <Divider sx={{ my: 0.5 }} />
        <SlotRow slot={match.team2} isWinner={Boolean(winner) && match.team2.team.country === winner} />
      </CardContent>
    </Card>
  )
}

function SlotRow({ slot, isWinner }: { readonly slot: ResultsSlot; readonly isWinner: boolean }): JSX.Element {
  const undecided = slot.team.name === ''
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 13 }}>
      {slot.origin && (
        <Typography component="span" variant="caption" color="text.disabled" sx={{ minWidth: 26 }}>
          {slot.origin}
        </Typography>
      )}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontWeight: isWinner ? 700 : 400,
          fontStyle: slot.provisional ? 'italic' : 'normal',
          color: undecided || slot.provisional ? 'text.disabled' : 'text.primary',
        }}
      >
        {undecided ? 'Por definir' : <TeamLabel team={slot.team} />}
      </Box>
      {slot.score !== null && (
        <Box component="span" sx={{ fontWeight: isWinner ? 700 : 400 }}>
          {slot.score}
        </Box>
      )}
    </Box>
  )
}

// TeamLabel shows the flag emoji and name. With `reverse`, the flag trails the
// name (used on the right-aligned home side of a fixture row).
function TeamLabel({ team, reverse }: { readonly team: ResultsTeam; readonly reverse?: boolean }): JSX.Element {
  const flag = flagEmoji(team.country)
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        maxWidth: '100%',
        flexDirection: reverse ? 'row-reverse' : 'row',
      }}
    >
      {flag && <span>{flag}</span>}
      <Box
        component="span"
        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {team.name}
      </Box>
    </Box>
  )
}

function formatGoalDiff(diff: number): string {
  return diff > 0 ? `+${diff}` : String(diff)
}
