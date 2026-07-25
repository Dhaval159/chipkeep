import { ChipCounter } from './ChipCounter'

interface PotCardProps {
  pot: number
  stake: number
  handNumber: number
  activeCount?: number
  dealerName?: string
}

export function PotCard({
  pot,
  stake,
  handNumber,
  activeCount,
  dealerName,
}: PotCardProps) {
  return (
    <div className="ck-pot-card">
      <span className="ck-pot-card__label">Current Pot</span>
      <ChipCounter value={pot} />
      <span className="ck-pot-card__unit">Chips</span>
      <div className="ck-pot-card__meta">
        <span>Stake {stake.toLocaleString()}</span>
        {activeCount !== undefined && <span>Active {activeCount}</span>}
      </div>
      <div className="ck-pot-card__meta">
        <span>Hand #{handNumber || '—'}</span>
        {dealerName && <span>Dealer: {dealerName}</span>}
      </div>
    </div>
  )
}
