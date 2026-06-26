import { useState } from 'react'
import { Alert, Box, Button, Card, CardContent, CircularProgress, Divider, Stack, Typography, useTheme } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import DownloadIcon from '@mui/icons-material/Download'
import { useResults } from '../api/hooks'
import { api, extractError } from '../api/client'
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
  ResultsThirdRow,
} from '../api/types'

// ResultsPage renders the tournament's real results — group standings and
// fixtures plus the knockout bracket — from the JSON served at
// GET /admin/results/json. It is recomputed from the live games table on every
// request, so "Actualizar" always shows the latest scores, standings, and the
// provisional bracket projection.
export function ResultsPage(): JSX.Element {
  const { data, isLoading, error, refetch, isFetching } = useResults()
  const [pdfBusy, setPdfBusy] = useState(false)
  const [pdfError, setPdfError] = useState('')

  // The PDF is the same data rendered server-side. Fetch it through the axios
  // client so the bearer token is attached, then hand the blob to the browser
  // as a download.
  const onDownloadPdf = async (): Promise<void> => {
    setPdfBusy(true)
    setPdfError('')
    try {
      const res = await api.get('/admin/results/pdf', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data as Blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'resultados.pdf'
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setPdfError(extractError(err))
    } finally {
      setPdfBusy(false)
    }
  }

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
    <Stack spacing={3} sx={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <SectionTitle>Resultados</SectionTitle>
        <Stack direction="row" spacing={1}>
          <Button
            startIcon={pdfBusy ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
            onClick={() => void onDownloadPdf()}
            disabled={pdfBusy}
          >
            PDF
          </Button>
          <Button startIcon={<RefreshIcon />} onClick={() => void refetch()} disabled={isFetching}>
            Actualizar
          </Button>
        </Stack>
      </Box>

      {pdfError && <Alert severity="error">{pdfError}</Alert>}

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

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
          Mejores terceros
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          * Clasifican los 8 mejores (clasificación provisional)
        </Typography>
        <Card variant="outlined" sx={{ maxWidth: 420 }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <BestThirdsTable rows={data.bestThirds ?? []} />
          </CardContent>
        </Card>
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
          {/* Break out of the page's horizontal padding so the bracket's
              scrollbar reaches the window edge; re-add it as inner padding so
              the first/last cards still have breathing room. */}
          <Box sx={{ overflowX: 'auto', pb: 1, mx: -3, px: 3 }}>
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

// BestThirdsTable renders the server-ranked best-thirds list: every group's
// third-placed team against each other in a single table. The eight that
// qualify (row.bestThird) are highlighted exactly like in StandingsTable, and a
// heavier bottom border marks the cut after the last qualifier so the in/out
// boundary is visible.
function BestThirdsTable({ rows }: { readonly rows: readonly ResultsThirdRow[] }): JSX.Element {
  const lastQualifier = rows.map((r) => r.bestThird).lastIndexOf(true)
  return (
    <Box
      component="table"
      sx={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: 12,
        '& th, & td': { py: 0.25, px: 0.5, textAlign: 'right', whiteSpace: 'nowrap' },
        '& th:nth-of-type(3), & td:nth-of-type(3)': { textAlign: 'left', width: '100%' },
        '& th': { color: 'text.secondary', fontWeight: 600 },
      }}
    >
      <thead>
        <tr>
          <th>#</th>
          <th>Grupo</th>
          <th>Equipo</th>
          <th>PJ</th>
          <th>Pts</th>
          <th>GF</th>
          <th>GC</th>
          <th>DG</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <Box
            component="tr"
            key={row.team.country || `${row.group}-${idx}`}
            sx={{
              ...(row.bestThird ? { bgcolor: 'action.hover' } : undefined),
              ...(idx === lastQualifier
                ? { '& td': { borderBottom: '2px solid', borderColor: 'divider' } }
                : undefined),
            }}
          >
            <td>{idx + 1}</td>
            <td>{row.group}</td>
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
// centred final. Rather than lean on CSS intrinsic sizing (which overlapped and
// over-grew), every match is placed at an explicit, computed position using the
// same slot/column geometry as the PDF (pdf/layout.go), and the connectors are
// an SVG overlay drawn from those same coordinates — so a parent always sits at
// the exact midpoint of its two feeders and nothing can overlap.
function Bracket({ rounds }: { readonly rounds: ResultsData['rounds'] }): JSX.Element {
  const theme = useTheme()
  const depth = rounds.length

  // The placement maths assume a clean halving tree (round k has 2^(depth-1-k)
  // matches). The backend always returns the full seeded bracket; if that ever
  // doesn't hold, fall back to plain columns instead of mis-placing cards.
  const cleanTree =
    depth >= 2 && rounds.every((r, k) => r.matches.length === 2 ** (depth - 1 - k))

  if (!cleanTree) {
    return (
      <Box sx={{ display: 'flex', gap: 3, width: 'max-content', mx: 'auto' }}>
        {rounds.map((round) => (
          <Stack key={round.round} spacing={1.5} sx={{ justifyContent: 'space-around' }}>
            <RoundLabel round={round} />
            {round.matches.map((match) => (
              <MatchCard key={match.gameId} match={match} />
            ))}
          </Stack>
        ))}
      </Box>
    )
  }

  const cols = 2 * depth - 1
  const perSide = rounds[0].matches.length / 2
  const colPitch = CARD_W + COL_GAP
  const totalW = cols * CARD_W + (cols - 1) * COL_GAP
  const totalH = perSide * UNIT

  const colX = (c: number): number => c * colPitch
  // Vertical centre of match `j` at round depth `d` — the PDF's matchCenterY.
  const centerY = (d: number, j: number): number => (j + 0.5) * 2 ** d * UNIT

  const cards: JSX.Element[] = []
  const lines: JSX.Element[] = []
  const addLine = (key: string, x1: number, y1: number, x2: number, y2: number): void => {
    lines.push(<line key={key} x1={x1} y1={y1} x2={x2} y2={y2} />)
  }

  for (let d = 0; d < depth; d++) {
    const matches = rounds[d].matches

    if (d === depth - 1) {
      // The final: a single match centred vertically (totalH/2), fed by the two
      // semi-finals which share that centre Y. (centerY's per-side formula would
      // overflow here, so the centre is taken directly.)
      const c = depth - 1
      const yMid = totalH / 2
      cards.push(<PlacedCard key="final" x={colX(c)} y={yMid} match={matches[0]} highlight />)
      addLine('final-l', colX(depth - 2) + CARD_W, yMid, colX(c), yMid)
      addLine('final-r', colX(cols - 1 - (depth - 2)), yMid, colX(c) + CARD_W, yMid)
      continue
    }

    const half = matches.length / 2
    matches.forEach((match, i) => {
      const isLeft = i < half
      const j = isLeft ? i : i - half
      const c = isLeft ? d : cols - 1 - d
      cards.push(
        <PlacedCard key={`${d}-${i}`} x={colX(c)} y={centerY(d, j)} match={match} mirror={!isLeft} />,
      )

      // Connector elbow from this match back to its two feeders one round out.
      if (d >= 1) {
        const childC = isLeft ? c - 1 : c + 1
        const y0 = centerY(d - 1, 2 * j)
        const y1 = centerY(d - 1, 2 * j + 1)
        const yp = centerY(d, j)
        const childEdge = isLeft ? colX(childC) + CARD_W : colX(childC)
        const parentEdge = isLeft ? colX(c) : colX(c) + CARD_W
        const gutter = (childEdge + parentEdge) / 2
        const k = `${d}-${i}`
        addLine(`${k}-a`, childEdge, y0, gutter, y0)
        addLine(`${k}-b`, childEdge, y1, gutter, y1)
        addLine(`${k}-v`, gutter, y0, gutter, y1)
        addLine(`${k}-p`, gutter, yp, parentEdge, yp)
      }
    })
  }

  return (
    // margin-inline auto centres the fixed-width draw when the viewport is wider
    // than it, and collapses to 0 (no clipping, start stays scrollable) when not.
    <Box sx={{ position: 'relative', width: totalW, height: totalH, mx: 'auto' }}>
      {/* Drawn first so the cards paint on top of the lines (DOM order, no z-index). */}
      <Box
        component="svg"
        width={totalW}
        height={totalH}
        viewBox={`0 0 ${totalW} ${totalH}`}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          stroke: theme.palette.divider,
          strokeWidth: 1.5,
        }}
      >
        {lines}
      </Box>
      {cards}
    </Box>
  )
}

// PlacedCard positions a MatchCard so its centre lands on (x left edge, y), the
// slot centre the connectors are drawn to.
function PlacedCard({
  x,
  y,
  match,
  mirror,
  highlight,
}: {
  readonly x: number
  readonly y: number
  readonly match?: ResultsMatch
  readonly mirror?: boolean
  readonly highlight?: boolean
}): JSX.Element {
  return (
    <Box sx={{ position: 'absolute', left: x, top: y - CARD_H / 2 }}>
      <MatchCard match={match} mirror={mirror} highlight={highlight} />
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
      sx={{
        flexShrink: 0,
        width: CARD_W,
        height: CARD_H,
        overflow: 'hidden',
        boxSizing: 'border-box',
        ...(highlight ? { borderColor: 'primary.main' } : {}),
      }}
    >
      <CardContent
        sx={{
          p: 0.75,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          '&:last-child': { pb: 0.75 },
        }}
      >
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

// Bracket geometry, in px. CARD_W/CARD_H are the fixed match-card size; UNIT is
// the vertical slot reserved per round-of-32 match (kept > CARD_H so cards never
// touch); COL_GAP is the space between round columns (and the connector run).
// Total width = (2*rounds-1)*CARD_W + (2*rounds-2)*COL_GAP — for a full bracket
// 9*150 + 8*24 = 1566px, comfortably inside a wide screen.
const CARD_W = 150
const CARD_H = 54
const UNIT = 72
const COL_GAP = 24

// Knockout rounds in the games-table numbering used by the backend
// (2 = round of 32 … 6 = final).
const ROUND_LABELS: Readonly<Record<number, string>> = {
  2: 'Dieciseisavos',
  3: 'Octavos',
  4: 'Cuartos',
  5: 'Semifinales',
  6: 'Final',
}

