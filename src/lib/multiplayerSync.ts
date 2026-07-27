import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import type { GameEngine } from '../engine/GameEngine'
import type { GameState, PlayerAction } from '../types/game'
import { perfMark, perfMeasure } from '../utils/perf'

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
  perfMark('FS_addDoc_start')
  await addDoc(actionsCollection(roomId), {
    action,
    playerId,
    createdAt: serverTimestamp(),
    processed: false,
  })
  perfMark('FS_addDoc_done')
  perfMeasure('FS_addDoc_start', 'FS_addDoc_done', 'Firestore write: addDoc action')
}

export function subscribeToPendingActionRequests(
  roomId: string,
  callback: (requests: MultiplayerActionRequest[]) => void,
): () => void {
  const actionsRef = actionsCollection(roomId)
  const actionQuery = query(actionsRef, where('processed', '==', false))

  return onSnapshot(actionQuery, (snapshot) => {
    perfMark('HOST_pendingActions_onSnapshot')
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

    perfMark('HOST_pendingActions_sorted')
    callback(requests)
  })
}

export async function processActionRequest(
  roomId: string,
  requestId: string,
  engine: GameEngine,
  currentState: GameState,
  processorId: string,
): Promise<GameState | null> {
  const roomRef = doc(db, 'rooms', roomId)
  const actionRef = doc(roomRef, 'actions', requestId)

  perfMark('FS_readAction_start')
  const actionSnapshot = await getDoc(actionRef)
  perfMark('FS_readAction_done')
  perfMeasure('FS_readAction_start', 'FS_readAction_done', 'Firestore read: action doc')

  if (!actionSnapshot.exists()) {
    perfMark('FS_action_not_found')
    return null
  }

  const actionData = actionSnapshot.data() as {
    action: PlayerAction
    processed: boolean
  }

  if (actionData.processed) {
    perfMark('FS_action_already_processed')
    return null
  }

  const player = currentState.players.find((p) => p.status === 'active')
  const isValid = Boolean(player && player.id === actionData.action.playerId)
  if (!currentState || !isValid) {
    await updateDoc(actionRef, {
      processed: true,
      processedAt: serverTimestamp(),
      processedBy: processorId,
    }).catch(() => {})
    perfMark('FS_action_invalid_marked')
    return null
  }

  perfMark('FS_engineExecute_start')
  const nextState = engine.executeAction(currentState, actionData.action)
  perfMark('FS_engineExecute_done')
  perfMeasure('FS_engineExecute_start', 'FS_engineExecute_done', 'GameEngine.executeAction')

  perfMark('FS_writeRoom_start')
  await updateDoc(roomRef, { gameState: nextState })
  perfMark('FS_writeRoom_done')
  perfMeasure('FS_writeRoom_start', 'FS_writeRoom_done', 'Firestore write: room gameState')

  perfMark('FS_markAction_start')
  await updateDoc(actionRef, {
    processed: true,
    processedAt: serverTimestamp(),
    processedBy: processorId,
  }).catch(() => {})
  perfMark('FS_markAction_done')
  perfMeasure('FS_markAction_start', 'FS_markAction_done', 'Firestore write: mark action processed')

  return nextState
}