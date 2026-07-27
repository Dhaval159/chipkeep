import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  collection,
  serverTimestamp,
  onSnapshot,
  deleteField,
  runTransaction,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Room, RoomPlayer, RoomStatus } from '../types/multiplayer'
import type { GameState } from '../types/game'

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

async function generateUniqueRoomCode(): Promise<string> {
  const roomsRef = collection(db, 'rooms')
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
    }
    const q = query(roomsRef, where('roomCode', '==', code))
    const snapshot = await getDocs(q)
    if (snapshot.empty) {
      return code
    }
  }
  throw new Error('Could not generate unique room code')
}

function toDate(value: Date | { toDate: () => Date } | unknown): Date {
  if (value instanceof Date) return value
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate()
  }
  return new Date()
}

function deserializeRoom(id: string, data: Record<string, unknown>): Room & { id: string } {
  const raw = data as unknown as Room
  return {
    id,
    roomCode: raw.roomCode,
    hostId: raw.hostId,
    createdAt: toDate(raw.createdAt),
    status: raw.status,
    gameState: (data.gameState as GameState | undefined) ?? null,
    players: Object.fromEntries(
      Object.entries(raw.players ?? {}).map(([pid, p]) => {
        const player = p as RoomPlayer
        return [
          pid,
          {
            ...player,
            joinedAt: toDate(player.joinedAt),
          },
        ]
      }),
    ),
  }
}

export async function startGameInRoom(
  roomId: string,
  gameState: GameState,
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId)
  await updateDoc(roomRef, {
    gameState,
    status: 'playing',
  })
}

export async function createRoom(
  hostId: string,
  displayName: string,
): Promise<{ roomId: string; roomCode: string }> {
  const roomCode = await generateUniqueRoomCode()
  const roomRef = doc(collection(db, 'rooms'))

  const player: RoomPlayer = {
    playerId: hostId,
    displayName,
    joinedAt: new Date(),
    isHost: true,
    isConnected: true,
  }

  await setDoc(roomRef, {
    roomCode,
    hostId,
    createdAt: serverTimestamp(),
    status: 'waiting',
    players: {
      [hostId]: {
        playerId: player.playerId,
        displayName: player.displayName,
        joinedAt: player.joinedAt,
        isHost: player.isHost,
        isConnected: player.isConnected,
      },
    },
    gameState: null,
  })

  return { roomId: roomRef.id, roomCode }
}

export async function getRoomByCode(
  roomCode: string,
): Promise<(Room & { id: string }) | null> {
  const q = query(collection(db, 'rooms'), where('roomCode', '==', roomCode))
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  const docSnap = snapshot.docs[0]
  return deserializeRoom(docSnap.id, docSnap.data() as Record<string, unknown>)
}

export async function getRoomById(
  roomId: string,
): Promise<(Room & { id: string }) | null> {
  const roomRef = doc(db, 'rooms', roomId)
  const snapshot = await getDoc(roomRef)
  if (!snapshot.exists()) return null
  return deserializeRoom(snapshot.id, snapshot.data() as Record<string, unknown>)
}

export async function joinRoom(
  roomId: string,
  playerId: string,
  displayName: string,
): Promise<Room & { id: string }> {
  const roomRef = doc(db, 'rooms', roomId)
  const roomSnap = await getDoc(roomRef)

  if (!roomSnap.exists()) {
    throw new Error('Room not found')
  }

  const room = deserializeRoom(roomSnap.id, roomSnap.data() as Record<string, unknown>)

  if (room.status !== 'waiting') {
    throw new Error('Room already started')
  }

  const existing = room.players[playerId]
  if (existing) {
    await updateDoc(roomRef, {
      [`players.${playerId}.isConnected`]: true,
      [`players.${playerId}.displayName`]: displayName,
    })
  } else {
    await updateDoc(roomRef, {
      [`players.${playerId}`]: {
        playerId,
        displayName,
        joinedAt: new Date(),
        isHost: false,
        isConnected: true,
      },
    })
  }

  const updated = await getDoc(roomRef)
  return deserializeRoom(updated.id, updated.data() as Record<string, unknown>)
}

export async function leaveRoom(
  roomId: string,
  playerId: string,
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId)
  await updateDoc(roomRef, {
    [`players.${playerId}`]: deleteField(),
  })

  const snap = await getDoc(roomRef)
  const data = snap.data()
  if (data) {
    const remaining = Object.keys(data.players ?? {}).filter(
      (k) => typeof data.players[k] === 'object' && data.players[k] !== null,
    )
    if (remaining.length === 0) {
      await updateDoc(roomRef, { status: 'finished' })
    }
  }
}

export async function reconnectToRoom(
  roomId: string,
  playerId: string,
): Promise<void> {
  try {
    const roomRef = doc(db, 'rooms', roomId)
    await updateDoc(roomRef, {
      [`players.${playerId}.isConnected`]: true,
      [`players.${playerId}.disconnectedAt`]: null,
    })
  } catch {
    /* best-effort */
  }
}

export async function markDisconnected(
  roomId: string,
  playerId: string,
): Promise<void> {
  try {
    const roomRef = doc(db, 'rooms', roomId)
    await updateDoc(roomRef, {
      [`players.${playerId}.isConnected`]: false,
      [`players.${playerId}.disconnectedAt`]: serverTimestamp(),
    })
  } catch {
    /* best-effort */
  }
}

export async function updateRoomStatus(
  roomId: string,
  status: RoomStatus,
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId)
  await updateDoc(roomRef, { status })
}

export async function electNewHost(
  roomId: string,
  candidatePlayerId: string,
): Promise<boolean> {
  const roomRef = doc(db, 'rooms', roomId)
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(roomRef)
      if (!snap.exists()) throw new Error('Room not found')

      const data = snap.data() as {
        hostId: string
        players: Record<string, RoomPlayer>
      }
      const currentHostId = data.hostId
      const hostPlayer = data.players[currentHostId]

      if (hostPlayer && hostPlayer.isConnected) {
        throw new Error('Host is still connected')
      }

      if (!data.players[candidatePlayerId]) {
        throw new Error('Candidate not in room')
      }

      tx.update(roomRef, {
        [`players.${currentHostId}.isHost`]: false,
        [`players.${candidatePlayerId}.isHost`]: true,
        hostId: candidatePlayerId,
      })
    })
    return true
  } catch {
    return false
  }
}

export function subscribeToRoom(
  roomId: string,
  callback: (room: (Room & { id: string }) | null) => void,
): () => void {
  const roomRef = doc(db, 'rooms', roomId)
  return onSnapshot(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(deserializeRoom(snapshot.id, snapshot.data() as Record<string, unknown>))
    } else {
      callback(null)
    }
  })
}
