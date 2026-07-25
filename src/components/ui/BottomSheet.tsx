import type { ReactNode, HTMLAttributes } from 'react'

interface BottomSheetProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function BottomSheet({ open, onClose, children, ...rest }: BottomSheetProps) {
  if (!open) return null

  return (
    <>
      <div className="ck-bottom-sheet-overlay" onClick={onClose} role="presentation" />
      <div
        className="ck-bottom-sheet"
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
