import { doc, updateDoc } from 'firebase/firestore'
import type { GameState, PlayerAction, StartGamePayload } from '../types/game'
import type { GameEngine } from '../engine/GameEngine'
import type { GameController } from './GameController'
import { subscribeToRoom } from '../lib/rooms'
import {
  publishPlayerActionRequest,
  processActionRequest,
  subscribeToPendingActionRequests,
} from '../lib/multiplayerSync'
import type { Room } from '../types/multiplayer'
import { db } from '../lib/firebase'
import { UndoManager } from '../utils/undoManager'
import { initialGameState } from '../context/GameContext'

export class MultiplayerGameController implements GameController {
  private _state: GameState
  private engine: GameEngine
  private readonly roomId: string
  private readonly playerId: string
  private hostId: string | null = null
  private isHost = false
  private _isReady = false
  private _error: string | null = null
  private listeners = new Set<() => void>()
  private roomUnsubscribe: (() => void) | null = null
  private actionUnsubscribe: (() => void) | null = null
  private processingActions = false
  private undoManager = new UndoManager()

  constructor(engine: GameEngine, roomId: string, playerId: string) {
    this.engine = engine
    this.roomId = roomId
    this.playerId = playerId
    this._state = initialGameState
  }

  start(): void {
    if (!this.roomUnsubscribe) {
      this.initialize()
    }
  }

  get state(): GameState {
    return this._state
  }

  get canUndo(): boolean {
    return this.isHost && this.undoManager.canUndo()
  }

  get ready(): boolean {
    return this._isReady
  }

  get error(): string | null {
    return this._error
  }

  get currentPlayerId(): string | null {
    return this._state.players.find((player) => player.status === 'active')?.id ?? null
  }

  get multiplayerMetadata() {
    return {
      roomId: this.roomId,
      playerId: this.playerId,
      hostId: this.hostId,
      isHost: this.isHost,
      isCurrentPlayerTurn: this.currentPlayerId === this.playerId,
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  startGame(_payload: StartGamePayload): void {
    void _payload
    // Multiplayer game start is managed by the room lobby flow.
  }

  startNewHand(): void {
    if (!this.isHost || !this._isReady || !this._state.handComplete) {
      return
    }
    const nextState = this.engine.createNewHandState(this._state)
    this.undoManager.pushSnapshot(this._state)
    this.updateRemoteState(nextState).catch((error) => {
      this.setError(error instanceof Error ? error.message : 'Failed to start new hand')
    })
  }

  advanceTurn(): void {
    if (!this.isHost || !this._isReady) {
      return
    }
    const nextState = this.engine.advanceTurn(this._state)
    if (nextState !== this._state) {
      this.undoManager.pushSnapshot(this._state)
      this.updateRemoteState(nextState).catch((error) => {
        this.setError(error instanceof Error ? error.message : 'Failed to advance turn')
      })
    }
  }

  dispatchAction(action: PlayerAction): void {
    if (!this._isReady) {
      return
    }

    if (!this.isCurrentTurn(action.playerId)) {
      return
    }

    publishPlayerActionRequest(this.roomId, action, this.playerId).catch((error) => {
      this.setError(error instanceof Error ? error.message : 'Failed to send action request')
    })
  }

  undo(): void {
    if (!this.isHost || !this._isReady || !this.undoManager.canUndo()) {
      return
    }

    const previousState = this.undoManager.undo()
    if (!previousState) {
      return
    }

    this.updateRemoteState(previousState).catch((error) => {
      this.setError(error instanceof Error ? error.message : 'Failed to undo last action')
    })
  }

  resetGame(): void {
    // Multiplayer reset is not supported through the game screen.
  }

  restoreGame(state: GameState): void {
    this._state = state
    this._isReady = true
    this._error = null
    this.notify()
  }

  dispose(): void {
    if (this.roomUnsubscribe) {
      this.roomUnsubscribe()
      this.roomUnsubscribe = null
    }
    if (this.actionUnsubscribe) {
      this.actionUnsubscribe()
      this.actionUnsubscribe = null
    }
  }

  private initialize(): void {
    this.roomUnsubscribe = subscribeToRoom(this.roomId, (room) => {
      this.handleRoomUpdate(room)
    })
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener()
    }
  }

  private setError(message: string | null): void {
    this._error = message
    this.notify()
  }

  private isCurrentTurn(playerId: string): boolean {
    return this._state.players.some(
      (player) => player.id === playerId && player.status === 'active' && player.id === this.currentPlayerId,
    )
  }

  private async updateRemoteState(state: GameState): Promise<void> {
    const roomRef = doc(db, 'rooms', this.roomId)
    await updateDoc(roomRef, { gameState: state })
  }

  private async handleRoomUpdate(room: Room | null): Promise<void> {
    if (!room) {
      this._isReady = false
      this.setError('Room not found')
      return
    }

    this.hostId = room.hostId
    const becameHost = room.hostId === this.playerId
    if (becameHost && !this.isHost) {
      this.isHost = true
      this.listenForPendingActions()
    } else if (!becameHost && this.isHost) {
      this.isHost = false
      this.stopListeningForPendingActions()
    }

    if (!room.gameState) {
      this._isReady = false
      if (room.status === 'finished') {
        this.setError('Game is not available.')
      } else {
        this._error = null
        this.notify()
      }
      return
    }

    this._error = null
    this._isReady = true
    this.restoreGame(room.gameState)
  }

  private listenForPendingActions(): void {
    if (this.actionUnsubscribe) {
      return
    }

    this.actionUnsubscribe = subscribeToPendingActionRequests(this.roomId, async (requests) => {
      if (this.processingActions || requests.length === 0) {
        return
      }

      this.processingActions = true
      try {
        for (const request of requests) {
          await processActionRequest(
            this.roomId,
            request.id,
            this.engine,
            this.playerId,
            this.validateAction.bind(this),
          )
        }
      } finally {
        this.processingActions = false
      }
    })
  }

  private stopListeningForPendingActions(): void {
    if (this.actionUnsubscribe) {
      this.actionUnsubscribe()
      this.actionUnsubscribe = null
    }
  }

  private validateAction(state: GameState, action: PlayerAction): boolean {
    const activePlayer = state.players.find((player) => player.status === 'active')
    return Boolean(activePlayer && activePlayer.id === action.playerId)
  }
}
