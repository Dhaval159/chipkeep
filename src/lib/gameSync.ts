import { doc, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'
import type { GameState } from '../types/game'

export function subscribeToGameState(
  roomId: string,
  callback: (state: GameState | null) => void,
): () => void {
  const roomRef = doc(db, 'rooms', roomId)
  return onSnapshot(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data()
      callback((data.gameState as GameState | undefined) ?? null)
    } else {
      callback(null)
    }
  })
}
