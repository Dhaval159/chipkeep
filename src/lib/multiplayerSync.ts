import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import type { GameEngine } from '../engine/GameEngine'
import type { GameState, PlayerAction } from '../types/game'

export interface MultiplayerActionRequest {
  id: string
  action: PlayerAction
  playerId: string
  createdAt: Date
  processed: boolean
  processedAt?: Date
  processedBy?: string
}

function actionsCollection(roomId: string) {
  return collection(db, 'rooms', roomId, 'actions')
}

export async function publishPlayerActionRequest(
  roomId: string,
  action: PlayerAction,
  playerId: string,
): Promise<void> {
  await addDoc(actionsCollection(roomId), {
    action,
    playerId,
    createdAt: serverTimestamp(),
    processed: false,
  })
}

export function subscribeToPendingActionRequests(
  roomId: string,
  callback: (requests: MultiplayerActionRequest[]) => void,
): () => void {
  const actionsRef = actionsCollection(roomId)
  const actionQuery = query(actionsRef, where('processed', '==', false))

  return onSnapshot(actionQuery, (snapshot) => {
    const requests = snapshot.docs
      .map((docSnapshot) => {
        const data = docSnapshot.data() as {
          action: PlayerAction
          playerId: string
          createdAt: { toDate: () => Date } | Date
          processed: boolean
        }

        return {
          id: docSnapshot.id,
          action: data.action,
          playerId: data.playerId,
          createdAt:
            data.createdAt instanceof Date
              ? data.createdAt
              : data.createdAt?.toDate?.() ?? new Date(),
          processed: data.processed,
        }
      })
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

    callback(requests)
  })
}

export async function processActionRequest(
  roomId: string,
  requestId: string,
  engine: GameEngine,
  processorId: string,
  validateAction: (state: GameState, action: PlayerAction) => boolean,
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId)
  const actionRef = doc(roomRef, 'actions', requestId)

  await runTransaction(db, async (tx) => {
    const actionSnapshot = await tx.get(actionRef)
    if (!actionSnapshot.exists()) {
      return
    }

    const actionData = actionSnapshot.data() as {
      action: PlayerAction
      processed: boolean
    }

    if (actionData.processed) {
      return
    }

    const roomSnapshot = await tx.get(roomRef)
    if (!roomSnapshot.exists()) {
      await tx.update(actionRef, {
        processed: true,
        processedAt: serverTimestamp(),
        processedBy: processorId,
      })
      return
    }

    const roomData = roomSnapshot.data() as { gameState?: GameState }
    const currentState = roomData.gameState as GameState | undefined
    if (!currentState || !validateAction(currentState, actionData.action)) {
      await tx.update(actionRef, {
        processed: true,
        processedAt: serverTimestamp(),
        processedBy: processorId,
      })
      return
    }

    const nextState = engine.executeAction(currentState, actionData.action)

    await tx.update(roomRef, {
      gameState: nextState,
    })

    await tx.update(actionRef, {
      processed: true,
      processedAt: serverTimestamp(),
      processedBy: processorId,
    })
  })
}
