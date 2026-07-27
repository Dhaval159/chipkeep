import { createContext } from 'react'
import type { GameState, PlayerAction, StartGamePayload } from '../types/game'

export interface GameContextValue {
  game: GameState
  startGame: (payload: StartGamePayload) => void
  startNewHand: () => void
  nextPlayer: () => void
  dispatchAction: (action: PlayerAction) => void
  resetGame: () => void
  restoreGame: (state: GameState) => void
  restoreGameState: (state: GameState) => void
  undo: () => void
  canUndo: boolean
  isMultiplayer: boolean
  multiplayer: {
    roomId: string
    playerId: string
    hostId: string | null
    isHost: boolean
    isCurrentPlayerTurn: boolean
  } | null
}

export const initialGameState: GameState = {
  status: 'idle',
  players: [],
  startingChips: 0,
  handNumber: 0,
  pot: 0,
  currentStake: 0,
  lastBet: 0,
  handComplete: false,
  winnerId: null,
  potWon: 0,
}

export const GameContext = createContext<GameContextValue | null>(null)
