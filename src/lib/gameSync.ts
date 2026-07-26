import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { GameState } from '../types/game'

export function subscribeToGameState(
  roomId: string,
  callback: (state: GameState | null, hostId?: string) => void,
): () => void {
  const roomRef = doc(db, 'rooms', roomId)
  return onSnapshot(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data()
      const gs = data.gameState as GameState | undefined
      callback(
        gs ?? null,
        data.hostId as string | undefined,
      )
    } else {
      callback(null)
    }
  })
}

export async function writeGameState(roomId: string, gameState: GameState): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId)
  await updateDoc(roomRef, { gameState })
}
