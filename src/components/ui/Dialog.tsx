import { useState, useEffect, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import { Button } from './Button'

interface DialogProps {
  open: boolean
  title: string
  description?: string
  children?: ReactNode
  primaryLabel: string
  primaryAction: () => void
  primaryDisabled?: boolean
  primaryLoading?: boolean
  secondaryLabel?: string
  secondaryAction?: () => void
  onClose: () => void
}

export function Dialog({
  open,
  title,
  description,
  children,
  primaryLabel,
  primaryAction,
  primaryDisabled = false,
  primaryLoading = false,
  secondaryLabel,
  secondaryAction,
  onClose,
}: DialogProps) {
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

  return (
    <div
      className={`ck-dialog-overlay${exiting ? ' ck-dialog-overlay--exiting' : ''}`}
      onClick={startExit}
      role="presentation"
    >
      <div
        className={`ck-dialog${exiting ? ' ck-dialog--exiting' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2 className="ck-dialog__title">{title}</h2>
        {description && <p className="ck-dialog__description">{description}</p>}
        {children}
        <div className="ck-dialog__actions">
          {secondaryLabel && (
            <Button
              variant="secondary"
              onClick={secondaryAction ?? startExit}
              disabled={exiting}
            >
              {secondaryLabel}
            </Button>
          )}
          <Button
            variant="primary"
            onClick={primaryAction}
            disabled={primaryDisabled || exiting}
            loading={primaryLoading}
          >
            {primaryLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
