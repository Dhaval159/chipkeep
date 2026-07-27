import type { Timestamp } from 'firebase/firestore'
import type { GameState } from './game'

export interface RoomPlayer {
  playerId: string
  displayName: string
  joinedAt: Date | Timestamp
  isHost: boolean
  isConnected: boolean
  disconnectedAt?: Date | Timestamp | null
}

export type RoomStatus = 'waiting' | 'playing' | 'finished'

export interface Room {
  roomCode: string
  hostId: string
  createdAt: Date | Timestamp
  status: RoomStatus
  players: Record<string, RoomPlayer>
  gameState: GameState | null
}
