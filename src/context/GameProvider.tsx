import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { GameState, PlayerAction, StartGamePayload } from '../types/game'
import { GameContext, initialGameState } from './GameContext'
import { GameEngineImpl } from '../engine/GameEngine'
import { LocalGameController } from '../controllers/LocalGameController'
import { LocalStoragePersistence } from '../persistence/LocalStoragePersistence'

function createController(): LocalGameController {
  return new LocalGameController(
    new GameEngineImpl(),
    new LocalStoragePersistence(),
    initialGameState,
  )
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<GameState>(initialGameState)
  const [controller] = useState(createController)

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
      undo,
      canUndo: controller.canUndo,
    }),
    [
      game,
      startGame,
      startNewHand,
      nextPlayer,
      dispatchAction,
      resetGame,
      restoreGame,
      undo,
      controller,
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
