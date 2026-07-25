import type { GameState, PlayerAction, StartGamePayload } from '../types/game'
import { playerActionReducer } from './playerActionEngine'
import { getFirstActiveIndex, getNextActiveIndex, setActivePlayer } from '../utils/turn'

export interface GameEngine {
  createInitialState(payload: StartGamePayload): GameState
  createIdleState(): GameState
  createNewHandState(state: GameState): GameState
  executeAction(state: GameState, action: PlayerAction): GameState
  advanceTurn(state: GameState): GameState
}

export class GameEngineImpl implements GameEngine {
  createInitialState(payload: StartGamePayload): GameState {
    return {
      status: 'in-progress',
      players: payload.players,
      startingChips: payload.startingChips,
      handNumber: 0,
      pot: 0,
      currentStake: 0,
      lastBet: 0,
      handComplete: false,
      winnerId: null,
      potWon: 0,
    }
  }

  createIdleState(): GameState {
    return {
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
  }

  createNewHandState(state: GameState): GameState {
    const resetPlayers = state.players.map((player) => ({
      ...player,
      status: 'waiting' as const,
      seen: false,
    }))
    const firstActive = getFirstActiveIndex(resetPlayers)
    return {
      ...state,
      handNumber: state.handNumber + 1,
      pot: 0,
      currentStake: 0,
      lastBet: 0,
      handComplete: false,
      winnerId: null,
      potWon: 0,
      players: setActivePlayer(resetPlayers, firstActive),
    }
  }

  executeAction(state: GameState, action: PlayerAction): GameState {
    return playerActionReducer(state, action)
  }

  advanceTurn(state: GameState): GameState {
    const currentIndex = state.players.findIndex((p) => p.status === 'active')
    const nextIndex = getNextActiveIndex(state.players, currentIndex)
    if (nextIndex === -1) {
      return state
    }
    return { ...state, players: setActivePlayer(state.players, nextIndex) }
  }
}
