import { memo } from 'react'
import type { Player } from '../types/game'

interface TablePlayerCardProps {
  player: Player
  isDealer: boolean
  isCurrentTurn: boolean
  isWinner: boolean
  position: number
}

const AVATAR_COLORS = [
  '#2563EB', '#7C3AED', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#06B6D4', '#8B5CF6',
  '#F97316', '#14B8A6', '#6366F1', '#D946EF',
]

function hashName(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getAvatarColor(name: string): string {
  const index = hashName(name) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

function getStatusLabel(player: Player): string {
  if (player.status === 'folded') return 'Folded'
  if (player.status === 'out') return 'Out'
  return player.status === 'active' ? 'Active' : 'Thinking'
}

function getStatusClass(status: string, isWinner: boolean): string {
  if (isWinner) return 'table-player-card__status--winner'
  if (status === 'folded' || status === 'out') return 'table-player-card__status--folded'
  if (status === 'active') return 'table-player-card__status--active'
  return 'table-player-card__status--thinking'
}

export const TablePlayerCard = memo(function TablePlayerCard({
  player,
  isDealer,
  isCurrentTurn,
  isWinner,
  position,
}: TablePlayerCardProps) {
  const isPacked = player.status === 'folded' || player.status === 'out'
  const statusLabel = getStatusLabel(player)
  const statusClass = getStatusClass(player.status, isWinner)

  const classes = [
    'table-player-card',
    'game-player-pos',
    `game-player-pos--${position}`,
    isCurrentTurn ? 'table-player-card--active' : '',
    isWinner ? 'table-player-card--winner' : '',
    isPacked ? 'table-player-card--packed' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      <div className="table-player-card__avatar-wrapper">
        <div
          className="table-player-card__avatar"
          style={{ background: getAvatarColor(player.name) }}
        >
          {getInitials(player.name)}
        </div>
        {isDealer && (
          <span className="table-player-card__dealer-badge">D</span>
        )}
      </div>
      <span className="table-player-card__name">{player.name}</span>
      <span className="table-player-card__chips">
        {player.chips.toLocaleString()}
      </span>
      <span className="table-player-card__blind">
        {player.seen ? 'Seen' : 'Blind'}
      </span>
      <span className={`table-player-card__status ${statusClass}`}>
        {statusLabel}
      </span>
    </div>
  )
})
