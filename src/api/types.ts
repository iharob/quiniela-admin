// Shapes mirror the admin endpoints in quiniela-rest-api (api/admin*.go).

export type ConsistencyStatus = 'NO_PREDICTIONS' | 'CONSISTENT' | 'INCONSISTENT'

export interface AdminUserListItem {
  userId: number
  name: string
  email: string
  bio: string
  loginType: 'google' | 'email' | 'both' | 'none'
  hasPredictions: boolean
  paymentStatus: 'UNPAID' | 'PENDING' | 'VERIFIED'
  paymentContact: string
  paymentNotes: string
  paymentMethods: string[]
  verifiedAt?: string
  consistency: ConsistencyStatus
  consistencyError?: string
}

export interface BracketGameFinding {
  gameId?: number
  class: string
  expected?: [string, string]
  stored?: [string, string]
  reason?: string
  proof?: string[]
}

export interface BracketPropFinding {
  gameId: number
  class: string
  feeder1: number
  feeder2: number
  expected: [string, string]
  stored: [string, string]
  reason?: string
}

export interface BracketCounts {
  exact: number
  swapped: number
  tie: number
  real: number
  missing: number
  propBroken: number
  propMissing: number
}

export interface BracketConsistency {
  counts: BracketCounts
  games?: BracketGameFinding[]
  propagation?: BracketPropFinding[]
}

export interface AdminUserConsistencyResponse {
  userId: number
  hasPredictions: boolean
  status: ConsistencyStatus
  consistency: BracketConsistency
  error?: string
}

export type PaymentStatus = 'UNPAID' | 'PENDING' | 'VERIFIED'

export interface PaymentMethod {
  paymentMethodId: number
  name: string
  label: string
}

export interface UserPayment {
  status: PaymentStatus
  contact: string
  notes: string
  verifiedAt?: string
  methodIds: number[]
}

export interface AdminGame {
  gameId: number
  team1: string
  team1Name: string
  team1Score: number | null
  team2: string
  team2Name: string
  team2Score: number | null
  winner: string
  round: number
  startsAt: string
  externalGameId?: number
}

export interface AdminSession {
  administratorId: number
  email: string
  name: string
  roles: string[]
}
