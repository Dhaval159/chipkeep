type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  name: string
  size?: AvatarSize
  className?: string
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

export function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const color = getAvatarColor(name)
  const initials = getInitials(name)

  return (
    <div
      className={`ck-avatar ck-avatar--${size} ${className}`}
      style={{ background: color }}
      aria-label={name}
      role="img"
    >
      {initials}
    </div>
  )
}
