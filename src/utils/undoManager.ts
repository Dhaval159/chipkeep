import type { GameState } from '../types/game'

const MAX_HISTORY = 50

function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state))
}

class UndoManagerImpl {
  private snapshots: GameState[] = []

  pushSnapshot(state: GameState): void {
    this.snapshots.push(cloneState(state))
    if (this.snapshots.length > MAX_HISTORY) {
      this.snapshots.shift()
    }
  }

  undo(): GameState | null {
    const snapshot = this.snapshots.pop()
    return snapshot ?? null
  }

  canUndo(): boolean {
    return this.snapshots.length > 0
  }

  clearHistory(): void {
    this.snapshots = []
  }
}

export const undoManager = new UndoManagerImpl()
