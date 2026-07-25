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
  if (!open) return null

  return (
    <div className="ck-dialog-overlay" onClick={onClose} role="presentation">
      <div
        className="ck-dialog"
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
              onClick={secondaryAction ?? onClose}
            >
              {secondaryLabel}
            </Button>
          )}
          <Button
            variant="primary"
            onClick={primaryAction}
            disabled={primaryDisabled}
            loading={primaryLoading}
          >
            {primaryLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
