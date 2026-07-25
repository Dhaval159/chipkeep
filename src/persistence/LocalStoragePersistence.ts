import type { GameState } from '../types/game'
import type { PersistenceProvider } from './PersistenceProvider'
import { saveGame, loadGame, clearSavedGame, hasSavedGame } from '../utils/storage'

export class LocalStoragePersistence implements PersistenceProvider {
  save(state: GameState): void {
    saveGame(state)
  }

  load(): GameState | null {
    return loadGame()
  }

  clear(): void {
    clearSavedGame()
  }

  hasSavedGame(): boolean {
    return hasSavedGame()
  }
}
