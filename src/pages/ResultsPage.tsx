import { Alert, Box, Button, Card, CardContent, CircularProgress, Divider, Stack, Typography } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useResults } from '../api/hooks'
import { extractError } from '../api/client'
import { SectionTitle } from '../components/SectionTitle'
import { flagEmoji } from '../utils/flag'
import type {
  ResultsData,
  ResultsGroup,
  ResultsGroupGame,
  ResultsMatch,
  ResultsRound,
  ResultsSlot,
  ResultsStandingRow,
  ResultsTeam,
} from '../api/types'

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
            <Bracket rounds={data.rounds} />
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

// Bracket draws the knockout stage as the PDF's two-sided key: the round of 32
// fans out from the left and right edges and converges, round by round, on the
// final in the centre. The backend returns each round already in bracket draw
// order, so the first half of every round is the left subtree and the second
// half the right — a strict binary tree we render recursively. The connector
// elbows are pure CSS: each match's two feeders occupy equal flup halves of the
// node, so their centres land exactly at 25%/75% and the border lines always
// meet, at any size.
function Bracket({ rounds }: { readonly rounds: ResultsData['rounds'] }): JSX.Element {
  const depth = rounds.length

  // Too few rounds to form a two-sided tree (e.g. only the final loaded): fall
  // back to a plain left-to-right column layout.
  if (depth < 2) {
    return (
      <Box sx={{ display: 'flex', gap: 3, width: 'max-content' }}>
        {rounds.map((round) => (
          <Stack key={round.round} spacing={1.5} sx={{ justifyContent: 'space-around', minWidth: 200 }}>
            <RoundLabel round={round} />
            {round.matches.map((match) => (
              <MatchCard key={match.gameId} match={match} />
            ))}
          </Stack>
        ))}
      </Box>
    )
  }

  const matchAt = (d: number, i: number): ResultsMatch | undefined => rounds[d]?.matches[i]
  const rootDepth = depth - 2 // the semi-final round feeds the final
  const final = matchAt(depth - 1, 0)

  return (
    <Box sx={BRACKET_SX}>
      <BracketNode depth={rootDepth} index={0} side="left" matchAt={matchAt} />
      <Box className="bk-final">
        {final && <MatchCard match={final} highlight />}
      </Box>
      <BracketNode depth={rootDepth} index={1} side="right" matchAt={matchAt} />
    </Box>
  )
}

function BracketNode({
  depth,
  index,
  side,
  matchAt,
}: {
  readonly depth: number
  readonly index: number
  readonly side: 'left' | 'right'
  readonly matchAt: (d: number, i: number) => ResultsMatch | undefined
}): JSX.Element {
  const match = matchAt(depth, index)
  const children =
    depth > 0 ? (
      <Box component="ul" className="bk-children">
        <Box component="li" className="bk-node">
          <BracketNode depth={depth - 1} index={index * 2} side={side} matchAt={matchAt} />
        </Box>
        <Box component="li" className="bk-node">
          <BracketNode depth={depth - 1} index={index * 2 + 1} side={side} matchAt={matchAt} />
        </Box>
      </Box>
    ) : null

  // On the left, feeders sit to the left of the match (and so render first); on
  // the right they sit to its right.
  const card = <MatchCard match={match} mirror={side === 'right'} />
  return (
    <Box className={`bk-leaf bk-${side}`}>
      {side === 'left' ? children : card}
      {side === 'left' ? card : children}
    </Box>
  )
}

function MatchCard({
  match,
  mirror,
  highlight,
}: {
  readonly match?: ResultsMatch
  readonly mirror?: boolean
  readonly highlight?: boolean
}): JSX.Element {
  const winner = match?.winner?.country
  return (
    <Card
      variant="outlined"
      sx={{ flexShrink: 0, width: 168, ...(highlight ? { borderColor: 'primary.main' } : {}) }}
    >
      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
        <SlotRow slot={match?.team1} mirror={mirror} isWinner={isWinner(match?.team1, winner)} />
        <Divider sx={{ my: 0.5 }} />
        <SlotRow slot={match?.team2} mirror={mirror} isWinner={isWinner(match?.team2, winner)} />
      </CardContent>
    </Card>
  )
}

function isWinner(slot: ResultsSlot | undefined, winner: string | undefined): boolean {
  return Boolean(winner) && slot?.team.country === winner
}

function SlotRow({
  slot,
  isWinner,
  mirror,
}: {
  readonly slot?: ResultsSlot
  readonly isWinner: boolean
  readonly mirror?: boolean
}): JSX.Element {
  const undecided = !slot || slot.team.name === ''
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        fontSize: 13,
        flexDirection: mirror ? 'row-reverse' : 'row',
      }}
    >
      {slot?.origin && (
        <Typography component="span" variant="caption" color="text.disabled" sx={{ minWidth: 26, textAlign: mirror ? 'right' : 'left' }}>
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
          textAlign: mirror ? 'right' : 'left',
          fontWeight: isWinner ? 700 : 400,
          color: undecided ? 'text.disabled' : 'text.primary',
        }}
      >
        {undecided ? 'Por definir' : <TeamLabel team={slot.team} reverse={mirror} />}
      </Box>
      {slot && slot.score !== null && (
        <Box component="span" sx={{ fontWeight: isWinner ? 700 : 400 }}>
          {slot.score}
        </Box>
      )}
    </Box>
  )
}

function RoundLabel({ round }: { readonly round: ResultsRound }): JSX.Element {
  return (
    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
      {ROUND_LABELS[round.round] ?? `Ronda ${round.round}`}
    </Typography>
  )
}

// TeamLabel shows the flag emoji and name. With `reverse`, the flag trails the
// name (used on the right-aligned side of a fixture or a mirrored bracket slot).
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
      <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {team.name}
      </Box>
    </Box>
  )
}

function formatGoalDiff(diff: number): string {
  return diff > 0 ? `+${diff}` : String(diff)
}

// Knockout rounds in the games-table numbering used by the backend
// (2 = round of 32 … 6 = final).
const ROUND_LABELS: Readonly<Record<number, string>> = {
  2: 'Dieciseisavos',
  3: 'Octavos',
  4: 'Cuartos',
  5: 'Semifinales',
  6: 'Final',
}

// Two-sided bracket geometry. Every node lays its match alongside a `bk-children`
// list of its two feeders; each feeder is a flup:1 half of the node, so feeder
// centres are always at 25%/75% and the connector borders (a vertical line
// between the two feeders plus horizontal stubs to each feeder and out to the
// parent) meet exactly, independent of pixel size. `--bk-gap` is the horizontal
// run of the connectors; `--bk-line`/`--bk-lw` its colour and thickness.
const BRACKET_SX = {
  '--bk-gap': '18px',
  '--bk-lw': '1.5px',
  '--bk-line': (theme: { palette: { divider: string } }) => theme.palette.divider,
  display: 'flex',
  alignItems: 'center',
  width: 'max-content',

  '& .bk-children': {
    listStyle: 'none',
    m: 0,
    p: 0,
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'stretch',
  },
  // Inside a feeder list each node takes an equal flup half, so feeder match
  // centres land at 25%/75% of the parent — where the connector borders meet.
  '& .bk-node': { display: 'flex', flex: '1 1 0', minHeight: 0 },
  // A node's row of [feeders | match]. Content-width (never grows horizontally)
  // so equal-shaped subtrees stay equal width and the stubs align; it stretches
  // vertically to fill its node, and centres its match on that height.
  '& .bk-leaf': { display: 'flex', alignItems: 'center', position: 'relative' },

  // Left side: feeders to the left of the match. Connectors run along the right
  // edge of the children list, toward the match.
  '& .bk-left > .bk-children': { marginRight: 'calc(2 * var(--bk-gap))', position: 'relative' },
  '& .bk-left > .bk-children::after': {
    content: '""',
    position: 'absolute',
    right: 'calc(-2 * var(--bk-gap))',
    width: 'var(--bk-gap)',
    top: '50%',
    borderTop: 'var(--bk-lw) solid var(--bk-line)',
  },
  '& .bk-left > .bk-children::before': {
    content: '""',
    position: 'absolute',
    right: 'calc(-1 * var(--bk-gap))',
    top: '25%',
    height: '50%',
    borderRight: 'var(--bk-lw) solid var(--bk-line)',
  },
  '& .bk-left > .bk-children > .bk-node > .bk-leaf::after': {
    content: '""',
    position: 'absolute',
    right: 'calc(-1 * var(--bk-gap))',
    width: 'var(--bk-gap)',
    top: '50%',
    borderTop: 'var(--bk-lw) solid var(--bk-line)',
  },

  // Right side: mirror image of the left.
  '& .bk-right > .bk-children': { marginLeft: 'calc(2 * var(--bk-gap))', position: 'relative' },
  '& .bk-right > .bk-children::after': {
    content: '""',
    position: 'absolute',
    left: 'calc(-2 * var(--bk-gap))',
    width: 'var(--bk-gap)',
    top: '50%',
    borderTop: 'var(--bk-lw) solid var(--bk-line)',
  },
  '& .bk-right > .bk-children::before': {
    content: '""',
    position: 'absolute',
    left: 'calc(-1 * var(--bk-gap))',
    top: '25%',
    height: '50%',
    borderLeft: 'var(--bk-lw) solid var(--bk-line)',
  },
  '& .bk-right > .bk-children > .bk-node > .bk-leaf::before': {
    content: '""',
    position: 'absolute',
    left: 'calc(-1 * var(--bk-gap))',
    width: 'var(--bk-gap)',
    top: '50%',
    borderTop: 'var(--bk-lw) solid var(--bk-line)',
  },

  // The final, centred, with a short stub out to each semi-final.
  '& .bk-final': {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    mx: 'calc(2 * var(--bk-gap))',
  },
  '& .bk-final::before, & .bk-final::after': {
    content: '""',
    position: 'absolute',
    top: '50%',
    width: 'calc(2 * var(--bk-gap))',
    borderTop: 'var(--bk-lw) solid var(--bk-line)',
  },
  '& .bk-final::before': { right: '100%' },
  '& .bk-final::after': { left: '100%' },
} as const
