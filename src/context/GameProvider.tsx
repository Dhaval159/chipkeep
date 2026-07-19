import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { GameState, PlayerAction, StartGamePayload } from '../types/game'
import { GameContext, initialGameState } from './GameContext'
import { getFirstActiveIndex, getNextActiveIndex, setActivePlayer } from '../utils/turn'
import { playerActionReducer } from '../engine/playerActionEngine'

export function GameProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<GameState>(initialGameState)

  const startGame = useCallback((payload: StartGamePayload) => {
    setGame({
      status: 'in-progress',
      players: payload.players,
      startingChips: payload.startingChips,
      handNumber: 0,
      pot: 0,
      currentStake: 0,
      lastBet: 0,
      handComplete: false,
      winnerId: null,
      potWon: 0,
    })
  }, [])

  const startNewHand = useCallback(() => {
    setGame((prev) => {
      const resetPlayers = prev.players.map((player) => ({
        ...player,
        status: 'waiting' as const,
        seen: false,
      }))
      const firstActive = getFirstActiveIndex(resetPlayers)
      return {
        ...prev,
        handNumber: prev.handNumber + 1,
        pot: 0,
        currentStake: 0,
        lastBet: 0,
        handComplete: false,
        winnerId: null,
        potWon: 0,
        players: setActivePlayer(resetPlayers, firstActive),
      }
    })
  }, [])

  const nextPlayer = useCallback(() => {
    setGame((prev) => {
      const currentIndex = prev.players.findIndex((p) => p.status === 'active')
      const nextIndex = getNextActiveIndex(prev.players, currentIndex)
      if (nextIndex === -1) {
        return prev
      }
      return { ...prev, players: setActivePlayer(prev.players, nextIndex) }
    })
  }, [])

  const dispatchAction = useCallback((action: PlayerAction) => {
    setGame((prev) => playerActionReducer(prev, action))
  }, [])

  const resetGame = useCallback(() => {
    setGame(initialGameState)
  }, [])

  const value = useMemo(
    () => ({
      game,
      startGame,
      startNewHand,
      nextPlayer,
      dispatchAction,
      resetGame,
    }),
    [
      game,
      startGame,
      startNewHand,
      nextPlayer,
      dispatchAction,
      resetGame,
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
