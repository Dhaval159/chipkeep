import { useContext } from 'react'
import { MultiplayerContext } from '../context/MultiplayerContext'
import type { MultiplayerContextValue } from '../context/MultiplayerContext'

export function useMultiplayer(): MultiplayerContextValue {
  const ctx = useContext(MultiplayerContext)
  if (!ctx) {
    throw new Error('useMultiplayer must be used within MultiplayerProvider')
  }
  return ctx
}
