import type { ReactNode } from 'react'
import type { Player } from '../../types/game'
import { Avatar } from './Avatar'
import { Badge } from './Badge'

interface PlayerCardProps {
  player: Player
  isDealer?: boolean
  isCurrentTurn?: boolean
  isWinner?: boolean
  compact?: boolean
  onClick?: () => void
  action?: ReactNode
}

export function PlayerCard({
  player,
  isDealer = false,
  isCurrentTurn = false,
  isWinner = false,
  compact = false,
  onClick,
  action,
}: PlayerCardProps) {
  const isPacked = player.status === 'folded'

  const classes = [
    'ck-player-card',
    compact ? 'ck-player-card--compact' : '',
    isCurrentTurn ? 'ck-player-card--current-turn' : '',
    isWinner ? 'ck-player-card--winner' : '',
    isPacked ? 'ck-player-card--packed' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
    >
      <Avatar name={player.name} size={compact ? 'sm' : 'md'} />
      <div className="ck-player-card__info">
        <span className="ck-player-card__name">{player.name}</span>
        {!compact && (
          <span className="ck-player-card__chips">
            {player.chips.toLocaleString()} Chips
          </span>
        )}
      </div>
      {!compact && (
        <div className="ck-player-card__badges">
          {isWinner && <Badge variant="winner">Winner</Badge>}
          {isDealer && <Badge variant="dealer">Dealer</Badge>}
          {isCurrentTurn && !isWinner && <Badge variant="active-turn">Active Turn</Badge>}
          {player.seen && !isWinner && <Badge variant="seen">Seen</Badge>}
          {!player.seen && !isWinner && !isPacked && <Badge variant="blind">Blind</Badge>}
          {isPacked && <Badge variant="packed">Packed</Badge>}
        </div>
      )}
      {action}
    </div>
  )
}
