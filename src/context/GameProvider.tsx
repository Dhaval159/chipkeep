import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { GameState, PlayerAction, StartGamePayload } from '../types/game'
import { GameContext, initialGameState } from './GameContext'
import { GameEngineImpl } from '../engine/GameEngine'
import { LocalGameController } from '../controllers/LocalGameController'
import { LocalStoragePersistence } from '../persistence/LocalStoragePersistence'

function createController(multiplayer: boolean): LocalGameController {
  const controller = new LocalGameController(
    new GameEngineImpl(),
    new LocalStoragePersistence(),
    initialGameState,
  )
  controller.setMultiplayer(multiplayer)
  return controller
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [multiplayer, setMultiplayer] = useState(() => {
    try {
      const raw = localStorage.getItem('chipkeep-current-room')
      if (raw) {
        const parsed = JSON.parse(raw)
        return !!(parsed && parsed.roomId)
      }
    } catch { /* ignore */ }
    return false
  })

  const [controller] = useState(() => createController(multiplayer))

  useEffect(() => {
    const detectMultiplayer = () => {
      try {
        const raw = localStorage.getItem('chipkeep-current-room')
        const inMultiplayer = raw ? !!(JSON.parse(raw)?.roomId) : false
        setMultiplayer(inMultiplayer)
        controller.setMultiplayer(inMultiplayer)
      } catch {
        setMultiplayer(false)
        controller.setMultiplayer(false)
      }
    }

    const handleRoomChange = () => detectMultiplayer()
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'chipkeep-current-room') detectMultiplayer()
    }

    window.addEventListener('chipkeep-room-change', handleRoomChange)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener('chipkeep-room-change', handleRoomChange)
      window.removeEventListener('storage', handleStorage)
    }
  }, [controller])

  const [game, setGame] = useState<GameState>(initialGameState)

  useEffect(() => {
    const unsub = controller.subscribe(() => {
      setGame(controller.state)
    })
    return unsub
  }, [controller])

  const startGame = useCallback(
    (payload: StartGamePayload) => controller.startGame(payload),
    [controller],
  )

  const startNewHand = useCallback(
    () => controller.startNewHand(),
    [controller],
  )

  const nextPlayer = useCallback(
    () => controller.advanceTurn(),
    [controller],
  )

  const dispatchAction = useCallback(
    (action: PlayerAction) => controller.dispatchAction(action),
    [controller],
  )

  const resetGame = useCallback(
    () => controller.resetGame(),
    [controller],
  )

  const restoreGame = useCallback(
    (state: GameState) => controller.restoreGame(state),
    [controller],
  )

  const restoreGameState = useCallback(
    (state: GameState) => controller.restoreGameState(state),
    [controller],
  )

  const undo = useCallback(
    () => controller.undo(),
    [controller],
  )

  const value = useMemo(
    () => ({
      game,
      startGame,
      startNewHand,
      nextPlayer,
      dispatchAction,
      resetGame,
      restoreGame,
      restoreGameState,
      undo,
      canUndo: controller.canUndo,
      isMultiplayer: multiplayer,
    }),
    [
      game,
      startGame,
      startNewHand,
      nextPlayer,
      dispatchAction,
      resetGame,
      restoreGame,
      restoreGameState,
      undo,
      controller,
      multiplayer,
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
