import { Clock, History, Settings } from 'lucide-react'

interface BottomNavProps {
  activeTab: 'history' | 'timeline' | 'settings'
  onHistory: () => void
  onTimeline: () => void
  onSettings: () => void
}

export function BottomNav({ activeTab, onHistory, onTimeline, onSettings }: BottomNavProps) {
  return (
    <nav className="game-bottom-nav">
      <button
        className={`game-bottom-nav__item ${activeTab === 'history' ? 'game-bottom-nav__item--active' : ''}`}
        onClick={onHistory}
        type="button"
        aria-label="History"
      >
        <span className="game-bottom-nav__icon">
          <History size={20} />
        </span>
        <span className="game-bottom-nav__label">History</span>
      </button>
      <button
        className={`game-bottom-nav__item ${activeTab === 'timeline' ? 'game-bottom-nav__item--active' : ''}`}
        onClick={onTimeline}
        type="button"
        aria-label="Timeline"
      >
        <span className="game-bottom-nav__icon">
          <Clock size={20} />
        </span>
        <span className="game-bottom-nav__label">Timeline</span>
      </button>
      <button
        className={`game-bottom-nav__item ${activeTab === 'settings' ? 'game-bottom-nav__item--active' : ''}`}
        onClick={onSettings}
        type="button"
        aria-label="Settings"
      >
        <span className="game-bottom-nav__icon">
          <Settings size={20} />
        </span>
        <span className="game-bottom-nav__label">Settings</span>
      </button>
    </nav>
  )
}
