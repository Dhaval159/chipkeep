import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInAnonymously as fbSignInAnonymously,
  type User,
} from 'firebase/auth'
import { auth } from '../lib/firebase'

export interface MultiplayerContextValue {
  user: User | null
  uid: string | null
  authLoading: boolean
  authError: string | null
  displayName: string
  setDisplayName: (name: string) => void
  currentRoom: { roomId: string; roomCode: string } | null
  setCurrentRoom: (room: { roomId: string; roomCode: string } | null) => void
  signInAnonymously: () => Promise<void>
}

export const MultiplayerContext = createContext<MultiplayerContextValue | null>(null)

const DISPLAY_NAME_KEY = 'chipkeep-display-name'
const ROOM_KEY = 'chipkeep-current-room'

function loadDisplayName(): string {
  return localStorage.getItem(DISPLAY_NAME_KEY) ?? ''
}

function saveDisplayName(name: string): void {
  localStorage.setItem(DISPLAY_NAME_KEY, name)
}

function loadRoom(): { roomId: string; roomCode: string } | null {
  try {
    const raw = localStorage.getItem(ROOM_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveRoom(room: { roomId: string; roomCode: string } | null): void {
  if (room) {
    localStorage.setItem(ROOM_KEY, JSON.stringify(room))
  } else {
    localStorage.removeItem(ROOM_KEY)
  }
}

export function MultiplayerProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [displayName, setDisplayNameState] = useState(loadDisplayName)
  const [currentRoom, setCurrentRoomState] = useState<{
    roomId: string
    roomCode: string
  } | null>(loadRoom)

  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      (u) => {
        setUser(u)
        setAuthLoading(false)
      },
      (err) => {
        setAuthError(err.message)
        setAuthLoading(false)
      },
    )
    return unsub
  }, [])

  useEffect(() => {
    if (!authLoading && !user && !authError) {
      fbSignInAnonymously(auth).catch((err) => {
        setAuthError(err.message)
      })
    }
  }, [authLoading, user, authError])

  const setDisplayName = useCallback((name: string) => {
    setDisplayNameState(name)
    saveDisplayName(name)
  }, [])

  const setCurrentRoom = useCallback(
    (room: { roomId: string; roomCode: string } | null) => {
      setCurrentRoomState(room)
      saveRoom(room)
    },
    [],
  )

  const signInAnonymously = useCallback(async () => {
    setAuthError(null)
    try {
      await fbSignInAnonymously(auth)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      setAuthError(message)
      throw err
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      uid: user?.uid ?? null,
      authLoading,
      authError,
      displayName,
      setDisplayName,
      currentRoom,
      setCurrentRoom,
      signInAnonymously,
    }),
    [
      user,
      authLoading,
      authError,
      displayName,
      setDisplayName,
      currentRoom,
      setCurrentRoom,
      signInAnonymously,
    ],
  )

  return (
    <MultiplayerContext.Provider value={value}>
      {children}
    </MultiplayerContext.Provider>
  )
}
