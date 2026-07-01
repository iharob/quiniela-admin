// Shapes mirror the admin endpoints in quiniela-rest-api (api/admin*.go).
// Every field is `readonly`: these are immutable server payloads, never mutated
// on the client.

export type ConsistencyStatus = 'NO_PREDICTIONS' | 'CONSISTENT' | 'INCONSISTENT'

export type LoginType = 'google' | 'email' | 'both' | 'none'

export type PaymentStatus = 'UNPAID' | 'PENDING' | 'VERIFIED'

export interface AdminUserListItem {
  readonly userId: number
  readonly name: string
  readonly email: string
  readonly bio: string
  readonly loginType: LoginType
  readonly hasPredictions: boolean
  readonly paymentStatus: PaymentStatus
  readonly paymentContact: string
  readonly paymentNotes: string
  readonly paymentMethods: readonly string[]
  readonly verifiedAt?: string
  readonly consistency: ConsistencyStatus
  readonly consistencyError?: string
}

// AdminRankingEntry mirrors the Go SimResult (api/elimination_sim.go), returned
// by GET /admin/rankings. `eliminated` is the simulation verdict: even if all of
// this player's remaining predictions come true (in a reachable world), someone
// else still leads — `leaderName`/`leaderScore` is who, and `dreamScore` is the
// most the player could still reach.
export interface AdminRankingEntry {
  readonly userID: number
  readonly userName: string
  readonly currentScore: number
  readonly currentRank: number
  readonly dreamScore: number
  readonly leaderID: number
  readonly leaderName: string
  readonly leaderScore: number
  readonly eliminated: boolean
}

export interface BracketGameFinding {
  readonly gameId?: number
  readonly class: string
  readonly expected?: readonly [string, string]
  readonly stored?: readonly [string, string]
  readonly reason?: string
  readonly proof?: readonly string[]
}

export interface BracketPropFinding {
  readonly gameId: number
  readonly class: string
  readonly feeder1: number
  readonly feeder2: number
  readonly expected: readonly [string, string]
  readonly stored: readonly [string, string]
  readonly reason?: string
}

export interface BracketCounts {
  readonly exact: number
  readonly swapped: number
  readonly tie: number
  readonly real: number
  readonly missing: number
  readonly propBroken: number
  readonly propMissing: number
}

export interface BracketConsistency {
  readonly counts: BracketCounts
  readonly games?: readonly BracketGameFinding[]
  readonly propagation?: readonly BracketPropFinding[]
}

export interface AdminUserConsistencyResponse {
  readonly userId: number
  readonly hasPredictions: boolean
  readonly status: ConsistencyStatus
  readonly consistency: BracketConsistency
  readonly error?: string
}

export interface PaymentMethod {
  readonly paymentMethodId: number
  readonly name: string
  readonly label: string
}

export interface UserPayment {
  readonly status: PaymentStatus
  readonly contact: string
  readonly notes: string
  readonly verifiedAt?: string
  readonly methodIds: readonly number[]
}

export interface AdminGame {
  readonly gameId: number
  readonly team1: string
  readonly team1Name: string
  readonly team1Score: number | null
  readonly team2: string
  readonly team2Name: string
  readonly team2Score: number | null
  readonly winner: string
  readonly round: number
  readonly startsAt: string
  readonly externalGameId?: number
}

export interface AdminSession {
  readonly administratorId: number
  readonly email: string
  readonly name: string
  readonly roles: readonly string[]
}

export type Currency = 'USD' | 'VES' | 'EUR'

export interface Settings {
  readonly entryFeeUsd: number
}

// Real-results data (admin/results/json). Mirrors pdf.ResultsData in
// quiniela-rest-api: group-stage scores, live standings, and the knockout
// bracket with a provisional round of 32 — the JSON twin of the results PDF.

export interface ResultsTeam {
  readonly name: string
  readonly country: string
}

export interface ResultsGroupGame {
  readonly team1: ResultsTeam
  readonly team2: ResultsTeam
  // null until the match has been played.
  readonly team1Score: number | null
  readonly team2Score: number | null
}

export interface ResultsStandingRow {
  readonly team: ResultsTeam
  readonly rank: number
  readonly played: number
  readonly points: number
  readonly goalsFor: number
  readonly goalsAgainst: number
  readonly goalDiff: number
  readonly yellowCards: number
  readonly redCards: number
  // FIFA fair-play tally (-1 per yellow, -3 per red); higher is better.
  readonly fairPlay: number
  // Currently among the eight best third-placed teams (provisional).
  readonly bestThird: boolean
}

export interface ResultsGroup {
  readonly name: string
  readonly games: readonly ResultsGroupGame[]
  readonly standings: readonly ResultsStandingRow[]
}

export interface ResultsSlot {
  // Empty name => slot undecided ("Por definir").
  readonly team: ResultsTeam
  // null until the match has been played.
  readonly score: number | null
  // Slot source label: a group-position seed ("2A") for the round of 32 or a
  // feeder game ("G74") for later rounds.
  readonly origin: string
  // Projected from current standings rather than really classified: render muted.
  readonly provisional: boolean
}

export interface ResultsMatch {
  readonly gameId: number
  readonly team1: ResultsSlot
  readonly team2: ResultsSlot
  readonly winner?: ResultsTeam
}

export interface ResultsRound {
  // games-table round numbering: 2 = round of 32 … 6 = final.
  readonly round: number
  readonly matches: readonly ResultsMatch[]
}

// One row of the cross-group best-thirds ranking: a group's third-placed team
// with the group it came from. Ordered by the server in qualification order;
// the first eight have bestThird true (they currently reach the round of 32).
export interface ResultsThirdRow {
  readonly group: string
  readonly team: ResultsTeam
  readonly played: number
  readonly points: number
  readonly goalsFor: number
  readonly goalsAgainst: number
  readonly goalDiff: number
  readonly yellowCards: number
  readonly redCards: number
  // FIFA fair-play tally (-1 per yellow, -3 per red); higher is better. Breaks
  // ties just above FIFA ranking. Zero until card data is ingested.
  readonly fairPlay: number
  readonly bestThird: boolean
}

export interface ResultsData {
  readonly groups: readonly ResultsGroup[]
  readonly rounds: readonly ResultsRound[]
  // Every group's third-placed team, pre-ranked by the server; the first eight
  // are the provisional qualifiers.
  readonly bestThirds: readonly ResultsThirdRow[]
  // Provisional-projection explanation; empty when the bracket has no
  // projected teams.
  readonly legend: string
}

export type LinkedPaymentStatus = 'PENDING' | 'VERIFIED'

export interface PaymentBeneficiary {
  readonly userId: number
  readonly name: string
}

export interface Payment {
  readonly paymentId: number
  readonly payerUserId: number
  readonly payerName: string
  readonly paymentMethodId?: number
  readonly paymentMethodLabel: string
  readonly amount?: number
  readonly currency: Currency
  readonly reference: string
  readonly proofImageUrl: string
  readonly notes: string
  readonly paidAt?: string
  readonly status: LinkedPaymentStatus
  readonly verifiedAt?: string
  readonly createdAt: string
  readonly beneficiaries: readonly PaymentBeneficiary[]
}
