import type { ReactNode } from 'react'

interface PotCardProps {
  label: string
  value: string
  unit?: string
  children?: ReactNode
}

export function PotCard({ label, value, unit, children }: PotCardProps) {
  return (
    <div className="ck-pot-card">
      <span className="ck-pot-card__label">{label}</span>
      <div className="ck-chip-counter">
        <span className="ck-chip-counter__value">{value}</span>
      </div>
      {unit && <span className="ck-pot-card__unit">{unit}</span>}
      {children && <div className="ck-pot-card__meta">{children}</div>}
    </div>
  )
}
