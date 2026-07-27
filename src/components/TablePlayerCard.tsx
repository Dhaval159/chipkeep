import { memo } from 'react'
import type { Player } from '../types/game'

interface TablePlayerCardProps {
  player: Player
  isDealer: boolean
  isCurrentTurn: boolean
  isWinner: boolean
  isDisconnected?: boolean
  position: number
}

const AVATAR_COLORS = [
  '#7C5CFC', '#38BDF8', '#34D399', '#F87171',
  '#FBBF24', '#A78BFA', '#FB923C', '#2DD4BF',
  '#818CF8', '#34D399', '#F472B6', '#A78BFA',
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
  return player.status === 'active' ? 'Thinking' : 'Waiting'
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
  isDisconnected = false,
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
    isPacked || isDisconnected ? 'table-player-card--packed' : '',
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
        {isDisconnected && (
          <span className="table-player-card__disconnected-badge">!</span>
        )}
      </div>
      <span className="table-player-card__name">
        {player.name}
        {isDisconnected && (
          <span className="table-player-card__disconnected-label"> (offline)</span>
        )}
      </span>
      <span className="table-player-card__chips">
        {player.chips.toLocaleString()}
      </span>
      <span className="table-player-card__blind">
        {player.seen ? 'Seen' : 'Blind'}
      </span>
      <span className={`table-player-card__status ${statusClass}`}>
        {isDisconnected ? 'Offline' : statusLabel}
      </span>
    </div>
  )
})
