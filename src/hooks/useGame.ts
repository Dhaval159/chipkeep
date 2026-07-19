import { useContext } from 'react'
import { GameContext } from '../context/GameContext'
import type { GameContextValue } from '../context/GameContext'

export function useGame(): GameContextValue {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}
