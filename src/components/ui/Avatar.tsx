import type { HTMLAttributes } from 'react'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string
  size?: AvatarSize
  ring?: boolean
  winnerRing?: boolean
}

const AVATAR_COLORS = [
  '#7C5CFC', '#38BDF8', '#34D399', '#F87171',
  '#FBBF24', '#A78BFA', '#FB923C', '#2DD4BF',
  '#818CF8', '#F472B6', '#E879F9', '#22D3EE',
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

export function Avatar({
  name,
  size = 'md',
  ring = false,
  winnerRing = false,
  className = '',
  ...rest
}: AvatarProps) {
  const colorIndex = hashName(name) % AVATAR_COLORS.length
  const classes = [
    'ck-avatar',
    `ck-avatar--${size}`,
    ring ? 'ck-avatar--ring' : '',
    winnerRing ? 'ck-avatar--winner-ring' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      style={{ background: AVATAR_COLORS[colorIndex] }}
      aria-label={name}
      {...rest}
    >
      {getInitials(name)}
    </div>
  )
}
