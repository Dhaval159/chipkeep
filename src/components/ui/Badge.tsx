type BadgeVariant = 'blind' | 'seen' | 'winner' | 'dealer' | 'packed' | 'active-turn'

interface BadgeProps {
  variant: BadgeVariant
  children: string
  className?: string
}

const VARIANT_LABELS: Record<BadgeVariant, string> = {
  'blind': 'Blind',
  'seen': 'Seen',
  'winner': 'Winner',
  'dealer': 'Dealer',
  'packed': 'Packed',
  'active-turn': 'Active Turn',
}

export function Badge({ variant, children, className = '' }: BadgeProps) {
  const label = VARIANT_LABELS[variant] ?? children

  return (
    <span className={`ck-badge ck-badge--${variant} ${className}`}>
      {label}
    </span>
  )
}
