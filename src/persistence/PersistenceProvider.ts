import type { GameState } from '../types/game'

export interface PersistenceProvider {
  save(state: GameState): void
  load(): GameState | null
  clear(): void
  hasSavedGame(): boolean
}
