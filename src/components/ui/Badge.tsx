import type { ReactNode } from 'react'

type BadgeVariant = 'blind' | 'seen' | 'winner' | 'dealer' | 'packed' | 'active-turn' | 'host'

interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`ck-badge ck-badge--${variant}`}>
      {children}
    </span>
  )
}
