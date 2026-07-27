import { useState, useEffect, useRef, useCallback } from 'react'
import type { ReactNode, HTMLAttributes } from 'react'

interface BottomSheetProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function BottomSheet({ open, onClose, children, ...rest }: BottomSheetProps) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startExit = useCallback(() => {
    setExiting(true)
    exitTimerRef.current = setTimeout(() => {
      setVisible(false)
      setExiting(false)
      onClose()
    }, 200)
  }, [onClose])

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setVisible(true)
      setExiting(false)
    } else if (visible) {
      startExit()
    }
  }, [open, visible, startExit])

  if (!visible && !open) return null

  const handleBackdropClick = () => {
    startExit()
  }

  return (
    <>
      <div
        className={`ck-bottom-sheet-overlay${exiting ? ' ck-bottom-sheet-overlay--exiting' : ''}`}
        onClick={handleBackdropClick}
        role="presentation"
      />
      <div
        className={`ck-bottom-sheet${exiting ? ' ck-bottom-sheet--exiting' : ''}`}
        role="dialog"
        aria-modal="true"
        {...rest}
      >
        <div className="ck-bottom-sheet__handle" />
        {children}
      </div>
    </>
  )
}
