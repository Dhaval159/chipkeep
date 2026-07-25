import type { GameState, PlayerAction, StartGamePayload } from '../types/game'
import type { GameEngine } from '../engine/GameEngine'
import type { PersistenceProvider } from '../persistence/PersistenceProvider'
import type { GameController } from './GameController'
import { undoManager } from '../utils/undoManager'
import { timeline } from '../utils/timeline'

export class LocalGameController implements GameController {
  private _state: GameState
  private engine: GameEngine
  private persistence: PersistenceProvider
  private listeners = new Set<() => void>()
  private handStartTime = 0
  private handPlayersAtStart: string[] = []

  constructor(
    engine: GameEngine,
    persistence: PersistenceProvider,
    initialState: GameState,
  ) {
    this.engine = engine
    this.persistence = persistence
    this._state = initialState
  }

  get state(): GameState {
    return this._state
  }

  get canUndo(): boolean {
    return undoManager.canUndo()
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener()
    }
    this.persistence.save(this._state)
  }

  startGame(payload: StartGamePayload): void {
    undoManager.clearHistory()
    timeline.clear()
    timeline.addEvent({
      handNumber: 0,
      playerName: null,
      actionType: 'GAME_STARTED',
      description: 'Game started',
    })
    this.handStartTime = Date.now()
    this.handPlayersAtStart = payload.players.map((p) => p.name)
    this._state = this.engine.createInitialState(payload)
    this.notify()
  }

  startNewHand(): void {
    undoManager.pushSnapshot(this._state)
    const newHandNumber = this._state.handNumber + 1
    timeline.addEvent({
      handNumber: newHandNumber,
      playerName: null,
      actionType: 'NEW_HAND',
      description: `Hand #${newHandNumber} started`,
    })
    this.handStartTime = Date.now()
    this.handPlayersAtStart = this._state.players.map((p) => p.name)
    this._state = this.engine.createNewHandState(this._state)
    this.notify()
  }

  advanceTurn(): void {
    const next = this.engine.advanceTurn(this._state)
    if (next !== this._state) {
      this._state = next
      this.notify()
    }
  }

  dispatchAction(action: PlayerAction): void {
    const playerName =
      this._state.players.find((p) => p.id === action.playerId)?.name ?? null

    switch (action.type) {
      case 'BET':
        timeline.addEvent({
          handNumber: this._state.handNumber,
          playerName,
          actionType: 'BET',
          description: `${playerName} bet ${action.amount} chips`,
        })
        break
      case 'PACK':
        timeline.addEvent({
          handNumber: this._state.handNumber,
          playerName,
          actionType: 'PACK',
          description: `${playerName} packed`,
        })
        break
      case 'SEE_CARDS':
        timeline.addEvent({
          handNumber: this._state.handNumber,
          playerName,
          actionType: 'SEE_CARDS',
          description: `${playerName} saw cards (Blind → Seen)`,
        })
        break
      case 'SIDE_SHOW': {
        const opponentName =
          this._state.players.find((p) => p.id === action.opponentId)?.name ?? null
        const loserName =
          this._state.players.find((p) => p.id === action.loserId)?.name ?? null
        const winnerName = action.loserId === action.playerId ? opponentName : playerName
        timeline.addEvent({
          handNumber: this._state.handNumber,
          playerName: winnerName,
          actionType: 'SIDE_SHOW',
          description: `${winnerName} won Side Show against ${loserName}`,
        })
        break
      }
      case 'SHOW': {
        const winnerName =
          this._state.players.find((p) => p.id === action.winnerId)?.name ?? null
        timeline.addEvent({
          handNumber: this._state.handNumber,
          playerName: winnerName,
          actionType: 'SHOW',
          description: `${winnerName} showed and won Hand #${this._state.handNumber}`,
        })
        break
      }
    }

    undoManager.pushSnapshot(this._state)
    const prevComplete = this._state.handComplete
    this._state = this.engine.executeAction(this._state, action)

    if (this._state.handComplete && !prevComplete) {
      const winner = this._state.players.find((p) => p.id === this._state.winnerId)
      timeline.addEvent({
        handNumber: this._state.handNumber,
        playerName: winner?.name ?? null,
        actionType: 'WINNER',
        description: `${winner?.name ?? 'Unknown'} won Hand #${this._state.handNumber} (${this._state.potWon} chips)`,
      })
      timeline.completeHand({
        handNumber: this._state.handNumber,
        winner: winner?.name ?? 'Unknown',
        potWon: this._state.potWon,
        playersAtStart: this.handPlayersAtStart,
        playersAtEnd: this._state.players.map((p) => ({
          name: p.name,
          chips: p.chips,
        })),
        startTime: this.handStartTime,
        endTime: Date.now(),
      })
    }

    this.notify()
  }

  undo(): void {
    const snapshot = undoManager.undo()
    if (snapshot) {
      timeline.addEvent({
        handNumber: snapshot.handNumber,
        playerName: null,
        actionType: 'UNDO',
        description: 'Undo last action',
      })
      this._state = snapshot
      this.notify()
    }
  }

  resetGame(): void {
    undoManager.clearHistory()
    timeline.clear()
    this._state = this.engine.createIdleState()
    this.notify()
  }

  restoreGame(state: GameState): void {
    undoManager.clearHistory()
    this._state = state
    this.notify()
  }
}
