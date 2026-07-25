import { ArrowLeft, MoreVertical } from 'lucide-react'

interface GameHeaderProps {
  title: string
  subtitle?: string
  onBack: () => void
  onMenu?: () => void
}

export function GameHeader({ title, subtitle, onBack, onMenu }: GameHeaderProps) {
  return (
    <header className="game-header">
      <div className="game-header__left">
        <button
          className="game-header__back"
          onClick={onBack}
          aria-label="Back"
          type="button"
        >
          <ArrowLeft size={20} />
        </button>
      </div>
      <div className="game-header__center">
        <span className="game-header__title">{title}</span>
        {subtitle && <span className="game-header__subtitle">{subtitle}</span>}
      </div>
      <button
        className="game-header__menu"
        onClick={onMenu}
        aria-label="Menu"
        type="button"
      >
        <MoreVertical size={20} />
      </button>
    </header>
  )
}
