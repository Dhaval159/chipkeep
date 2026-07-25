import type { Timestamp } from 'firebase/firestore'

export interface RoomPlayer {
  playerId: string
  displayName: string
  joinedAt: Date | Timestamp
  isHost: boolean
  isConnected: boolean
}

export type RoomStatus = 'waiting' | 'playing' | 'finished'

export interface Room {
  roomCode: string
  hostId: string
  createdAt: Date | Timestamp
  status: RoomStatus
  players: Record<string, RoomPlayer>
  gameState: null
}
