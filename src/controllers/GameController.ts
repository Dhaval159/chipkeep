import type { GameState, PlayerAction, StartGamePayload } from '../types/game'

export interface GameController {
  readonly state: GameState
  readonly canUndo: boolean

  startGame(payload: StartGamePayload): void
  startNewHand(): void
  advanceTurn(): void
  dispatchAction(action: PlayerAction): void
  undo(): void
  resetGame(): void
  restoreGame(state: GameState): void

  subscribe(listener: () => void): () => void
}
