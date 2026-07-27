import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { GameContext, initialGameState } from './GameContext'
import { MultiplayerGameController } from '../controllers/MultiplayerGameController'
import { GameEngineImpl } from '../engine/GameEngine'
import { useMultiplayer } from '../hooks/useMultiplayer'
import { clearSavedGame } from '../utils/storage'
import { reconnectToRoom, markDisconnected } from '../lib/rooms'
import type { GameContextValue } from './GameContext'
import { perfMark, perfMeasure } from '../utils/perf'

export function MultiplayerGameProvider({ children }: { children: ReactNode }) {
  const { roomId } = useParams<{ roomId: string }>()
  const { uid } = useMultiplayer()
  const navigate = useNavigate()

  const controller = useMemo(() => {
    if (!roomId || !uid) {
      return null
    }

    return new MultiplayerGameController(new GameEngineImpl(), roomId, uid)
  }, [roomId, uid])

  const [game, setGame] = useState(initialGameState)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!controller) {
      return
    }

    controller.start()
    const unsubscribe = controller.subscribe(() => {
      perfMark('REACT_setGame_start')
      setGame(controller.state)
      setReady(controller.ready)
      setError(controller.error)
      perfMark('REACT_setGame_done')
      perfMeasure('REACT_setGame_start', 'REACT_setGame_done', 'React setGame + setReady + setError')
    })

    clearSavedGame()

    return () => {
      unsubscribe()
      controller.dispose()
      setReady(false)
      setError(null)
    }
  }, [controller])

  useEffect(() => {
    if (!roomId || !uid) {
      return
    }

    reconnectToRoom(roomId, uid)

    const handleBeforeUnload = () => {
      markDisconnected(roomId, uid)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [roomId, uid])

  if (!roomId) {
    return (
      <div className="game-page">
        <div className="game-empty">
          <p className="game-empty__text">Multiplayer room not found.</p>
        </div>
      </div>
    )
  }

  if (!uid) {
    return (
      <div className="game-page">
        <div className="game-empty">
          <div className="ck-btn__spinner" />
          <p className="game-empty__text">Connecting to multiplayer...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="game-page">
        <div className="game-empty">
          <p className="game-empty__text">{error}</p>
          <button className="ck-btn ck-btn--primary" type="button" onClick={() => navigate('/')}>
            Return Home
          </button>
        </div>
      </div>
    )
  }

  if (!controller || !ready) {
    return (
      <div className="game-page">
        <div className="game-empty">
          <div className="ck-btn__spinner" />
          <p className="game-empty__text">Loading multiplayer game...</p>
        </div>
      </div>
    )
  }

  const multiplayerMetadata = controller.multiplayerMetadata
  const value: GameContextValue = {
    game,
    startGame: (payload) => controller.startGame(payload),
    startNewHand: () => controller.startNewHand(),
    nextPlayer: () => controller.advanceTurn(),
    dispatchAction: (action) => controller.dispatchAction(action),
    resetGame: () => controller.resetGame(),
    restoreGame: (state) => controller.restoreGame(state),
    restoreGameState: (state) => controller.restoreGameState(state),
    undo: () => controller.undo(),
    canUndo: controller.canUndo,
    isMultiplayer: true,
    multiplayer: multiplayerMetadata,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
