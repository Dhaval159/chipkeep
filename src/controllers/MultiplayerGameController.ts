import { doc, updateDoc } from 'firebase/firestore'
import type { GameState, PlayerAction, StartGamePayload } from '../types/game'
import type { GameEngine } from '../engine/GameEngine'
import type { GameController } from './GameController'
import { subscribeToRoom, electNewHost } from '../lib/rooms'
import {
  publishPlayerActionRequest,
  processActionRequest,
  subscribeToPendingActionRequests,
} from '../lib/multiplayerSync'
import type { Room, RoomPlayer } from '../types/multiplayer'
import { db } from '../lib/firebase'
import { UndoManager } from '../utils/undoManager'
import { initialGameState } from '../context/GameContext'
import { getNextActiveIndex, isEligibleForTurn, setActivePlayer } from '../utils/turn'

const DISCONNECT_TIMEOUT_MS = 60_000

export class MultiplayerGameController implements GameController {
  private _state: GameState
  private engine: GameEngine
  private readonly roomId: string
  private readonly playerId: string
  private hostId: string | null = null
  private isHost = false
  private _isReady = false
  private _error: string | null = null
  private _connectionStatus: 'connected' | 'reconnecting' | 'disconnected' = 'reconnecting'
  private listeners = new Set<() => void>()
  private roomUnsubscribe: (() => void) | null = null
  private actionUnsubscribe: (() => void) | null = null
  private processingActions = false
  private undoManager = new UndoManager()
  private electionInProgress = false
  private foldingInProgress = false
  private _disconnectedPlayerIds: string[] = []

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

  get connectionStatus(): 'connected' | 'reconnecting' | 'disconnected' {
    return this._connectionStatus
  }

  get currentPlayerId(): string | null {
    const active = this._state.players.find((player) => player.status === 'active')
    return active?.id ?? null
  }

  get isCurrentPlayerTurn(): boolean {
    return this.currentPlayerId === this.playerId
  }

  get multiplayerMetadata() {
    return {
      roomId: this.roomId,
      playerId: this.playerId,
      hostId: this.hostId,
      isHost: this.isHost,
      isCurrentPlayerTurn: this.isCurrentPlayerTurn,
      connectionStatus: this._connectionStatus as 'connected' | 'reconnecting' | 'disconnected',
      disconnectedPlayerIds: this._disconnectedPlayerIds,
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  startGame(_payload: StartGamePayload): void {
    void _payload
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

    if (action.playerId !== this.playerId) {
      return
    }

    if (!this.isCurrentPlayerTurn) {
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
  }

  restoreGame(state: GameState): void {
    this._state = state
    this._isReady = true
    this._error = null
    this.notify()
  }

  restoreGameState(state: GameState): void {
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

  private setConnectionStatus(status: 'connected' | 'reconnecting' | 'disconnected'): void {
    if (this._connectionStatus !== status) {
      this._connectionStatus = status
      this.notify()
    }
  }

  private setError(message: string | null): void {
    this._error = message
    this.notify()
  }

  private async updateRemoteState(state: GameState): Promise<void> {
    const roomRef = doc(db, 'rooms', this.roomId)
    await updateDoc(roomRef, { gameState: state })
  }

  private getDisconnectedAtMs(player: RoomPlayer): number | null {
    if (!player.disconnectedAt) return null
    const ts = player.disconnectedAt as { toDate?: () => Date; seconds?: number }
    if (ts.toDate) {
      return ts.toDate().getTime()
    }
    if (ts.seconds) {
      return ts.seconds * 1000
    }
    return null
  }

  private async handleRoomUpdate(room: Room | null): Promise<void> {
    if (!room) {
      this._isReady = false
      this.setConnectionStatus('reconnecting')
      return
    }

    this.setConnectionStatus('connected')
    this._disconnectedPlayerIds = Object.entries(room.players)
      .filter(([, p]) => !p.isConnected)
      .map(([pid]) => pid)
    this.hostId = room.hostId
    const becameHost = room.hostId === this.playerId
    if (becameHost && !this.isHost) {
      this.isHost = true
      this.listenForPendingActions()
    } else if (!becameHost && this.isHost) {
      this.isHost = false
      this.stopListeningForPendingActions()
    }

    // Host election: detect disconnected host and claim host atomically
    if (!this.isHost && !this.electionInProgress) {
      const hostPlayer = room.players[room.hostId]
      if (hostPlayer && !hostPlayer.isConnected) {
        this.electionInProgress = true
        const elected = await electNewHost(this.roomId, this.playerId)
        this.electionInProgress = false
        if (elected) {
          return
        }
      }
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

    // Host-only: handle timed-out disconnected players
    if (this.isHost && !this.foldingInProgress && !this._state.handComplete) {
      this.foldingInProgress = true
      try {
        await this.processDisconnectedPlayers(room)
      } finally {
        this.foldingInProgress = false
      }
    }
  }

  private async processDisconnectedPlayers(room: Room): Promise<void> {
    const now = Date.now()
    let stateModified = false
    let updatedState = this._state

    for (const [pid, player] of Object.entries(room.players)) {
      if (player.isConnected) continue

      const disconnectedAtMs = this.getDisconnectedAtMs(player)
      if (!disconnectedAtMs) continue
      if (now - disconnectedAtMs < DISCONNECT_TIMEOUT_MS) continue

      const gamePlayer = updatedState.players.find((gp) => gp.id === pid)
      if (!gamePlayer || !isEligibleForTurn(gamePlayer)) continue

      updatedState = this.foldPlayer(updatedState, pid)
      stateModified = true
    }

    if (stateModified) {
      await this.updateRemoteState(updatedState)
    }
  }

  private foldPlayer(state: GameState, playerId: string): GameState {
    const folded: GameState = {
      ...state,
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, status: 'folded' as const } : p,
      ),
    }

    const advanced = this.advanceAfterFold(folded, playerId)
    return this.settleIfWon(advanced)
  }

  private advanceAfterFold(state: GameState, foldedPlayerId: string): GameState {
    const foldedIndex = state.players.findIndex((p) => p.id === foldedPlayerId)
    if (foldedIndex === -1) return state

    const nextIndex = getNextActiveIndex(state.players, foldedIndex)
    if (nextIndex === -1) return state

    return { ...state, players: setActivePlayer(state.players, nextIndex) }
  }

  private settleIfWon(state: GameState): GameState {
    if (state.handComplete) return state
    const remaining = state.players.filter(isEligibleForTurn)
    if (remaining.length === 1) {
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === remaining[0].id
            ? { ...p, chips: p.chips + state.pot, status: 'waiting' as const }
            : p,
        ),
        handComplete: true,
        winnerId: remaining[0].id,
        potWon: state.pot,
        pot: 0,
        currentStake: 0,
        lastBet: 0,
      }
    }
    return state
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
