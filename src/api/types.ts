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
