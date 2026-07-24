import type { GameState } from '../types/game'

const STORAGE_KEY = 'chipkeep-saved-game'

function isValidGameState(data: unknown): data is GameState {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  if (d.status !== 'idle' && d.status !== 'in-progress') return false
  if (!Array.isArray(d.players)) return false
  if (typeof d.startingChips !== 'number') return false
  if (typeof d.handNumber !== 'number') return false
  if (typeof d.pot !== 'number') return false
  if (typeof d.currentStake !== 'number') return false
  if (typeof d.lastBet !== 'number') return false
  if (typeof d.handComplete !== 'boolean') return false
  if (typeof d.potWon !== 'number') return false
  return true
}

export function saveGame(state: GameState): void {
  try {
    if (state.status === 'in-progress' && state.players.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Storage unavailable - silently ignore
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!isValidGameState(parsed)) {
      clearSavedGame()
      return null
    }
    return parsed as GameState
  } catch {
    clearSavedGame()
    return null
  }
}

export function clearSavedGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage unavailable - silently ignore
  }
}

export function hasSavedGame(): boolean {
  return loadGame() !== null
}
