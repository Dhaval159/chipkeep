import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { GameState, PlayerAction, StartGamePayload } from '../types/game'
import { GameContext, initialGameState } from './GameContext'
import { getFirstActiveIndex, getNextActiveIndex, setActivePlayer } from '../utils/turn'
import { playerActionReducer } from '../engine/playerActionEngine'
import { saveGame } from '../utils/storage'
import { undoManager } from '../utils/undoManager'
import { timeline } from '../utils/timeline'

export function GameProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<GameState>(initialGameState)
  const handStartTimeRef = useRef<number>(0)
  const handPlayersAtStartRef = useRef<string[]>([])

  const startGame = useCallback((payload: StartGamePayload) => {
    undoManager.clearHistory()
    timeline.clear()
    timeline.addEvent({
      handNumber: 0,
      playerName: null,
      actionType: 'GAME_STARTED',
      description: 'Game started',
    })
    handStartTimeRef.current = Date.now()
    handPlayersAtStartRef.current = payload.players.map((p) => p.name)
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
    undoManager.pushSnapshot(game)
    const newHandNumber = game.handNumber + 1
    timeline.addEvent({
      handNumber: newHandNumber,
      playerName: null,
      actionType: 'NEW_HAND',
      description: `Hand #${newHandNumber} started`,
    })
    handStartTimeRef.current = Date.now()
    handPlayersAtStartRef.current = game.players.map((p) => p.name)
    setGame((prev) => {
      const resetPlayers = prev.players.map((player) => ({
        ...player,
        status: 'waiting' as const,
        seen: false,
      }))
      const firstActive = getFirstActiveIndex(resetPlayers)
      return {
        ...prev,
        handNumber: newHandNumber,
        pot: 0,
        currentStake: 0,
        lastBet: 0,
        handComplete: false,
        winnerId: null,
        potWon: 0,
        players: setActivePlayer(resetPlayers, firstActive),
      }
    })
  }, [game])

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
    const playerName = game.players.find((p) => p.id === action.playerId)?.name ?? null
    switch (action.type) {
      case 'BET':
        timeline.addEvent({
          handNumber: game.handNumber,
          playerName,
          actionType: 'BET',
          description: `${playerName} bet ${action.amount} chips`,
        })
        break
      case 'PACK':
        timeline.addEvent({
          handNumber: game.handNumber,
          playerName,
          actionType: 'PACK',
          description: `${playerName} packed`,
        })
        break
      case 'SEE_CARDS':
        timeline.addEvent({
          handNumber: game.handNumber,
          playerName,
          actionType: 'SEE_CARDS',
          description: `${playerName} saw cards (Blind → Seen)`,
        })
        break
      case 'SIDE_SHOW': {
        const opponentName = game.players.find((p) => p.id === action.opponentId)?.name ?? null
        const loserName = game.players.find((p) => p.id === action.loserId)?.name ?? null
        const winnerName = action.loserId === action.playerId ? opponentName : playerName
        timeline.addEvent({
          handNumber: game.handNumber,
          playerName: winnerName,
          actionType: 'SIDE_SHOW',
          description: `${winnerName} won Side Show against ${loserName}`,
        })
        break
      }
      case 'SHOW': {
        const winnerName = game.players.find((p) => p.id === action.winnerId)?.name ?? null
        timeline.addEvent({
          handNumber: game.handNumber,
          playerName: winnerName,
          actionType: 'SHOW',
          description: `${winnerName} showed and won Hand #${game.handNumber}`,
        })
        break
      }
    }

    undoManager.pushSnapshot(game)
    const nextState = playerActionReducer(game, action)
    if (nextState.handComplete && !game.handComplete) {
      const winner = nextState.players.find((p) => p.id === nextState.winnerId)
      timeline.addEvent({
        handNumber: game.handNumber,
        playerName: winner?.name ?? null,
        actionType: 'WINNER',
        description: `${winner?.name ?? 'Unknown'} won Hand #${game.handNumber} (${nextState.potWon} chips)`,
      })
      timeline.completeHand({
        handNumber: game.handNumber,
        winner: winner?.name ?? 'Unknown',
        potWon: nextState.potWon,
        playersAtStart: handPlayersAtStartRef.current,
        playersAtEnd: nextState.players.map((p) => ({ name: p.name, chips: p.chips })),
        startTime: handStartTimeRef.current,
        endTime: Date.now(),
      })
    }
    setGame(nextState)
  }, [game])

  const resetGame = useCallback(() => {
    undoManager.clearHistory()
    timeline.clear()
    setGame(initialGameState)
  }, [])

  const restoreGame = useCallback((state: GameState) => {
    undoManager.clearHistory()
    setGame(state)
  }, [])

  const undo = useCallback(() => {
    const snapshot = undoManager.undo()
    if (snapshot) {
      timeline.addEvent({
        handNumber: snapshot.handNumber,
        playerName: null,
        actionType: 'UNDO',
        description: 'Undo last action',
      })
      setGame(snapshot)
    }
  }, [])

  useEffect(() => {
    saveGame(game)
  }, [game])

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
      canUndo: undoManager.canUndo(),
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
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
