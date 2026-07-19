export type PlayerStatus = 'waiting' | 'active' | 'folded' | 'out'

export type GameStatus = 'idle' | 'in-progress'

export interface Player {
  id: string
  name: string
  chips: number
  status: PlayerStatus
  seen: boolean
}

export interface GameState {
  status: GameStatus
  players: Player[]
  startingChips: number
  handNumber: number
  pot: number
  currentStake: number
  lastBet: number
  handComplete: boolean
  winnerId: string | null
  potWon: number
}

export interface StartGamePayload {
  players: Player[]
  startingChips: number
}

export type PlayerActionType =
  | 'BET'
  | 'PACK'
  | 'SIDE_SHOW'
  | 'SHOW'
  | 'SEE_CARDS'

export interface BetAction {
  type: 'BET'
  playerId: string
  amount: number
}

export interface PackAction {
  type: 'PACK'
  playerId: string
}

export interface SideShowAction {
  type: 'SIDE_SHOW'
  playerId: string
  opponentId: string
  loserId: string
}

export interface ShowAction {
  type: 'SHOW'
  playerId: string
  winnerId: string
}

export interface SeeCardsAction {
  type: 'SEE_CARDS'
  playerId: string
}

export type PlayerAction =
  | BetAction
  | PackAction
  | SideShowAction
  | ShowAction
  | SeeCardsAction
