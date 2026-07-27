import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { HandSummary } from '../types/timeline'
import { timeline } from '../utils/timeline'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import { ArrowLeft, Trophy, Clock, Users, Wallet, ArrowUpDown } from 'lucide-react'

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString()
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ${seconds % 60}s`
}

function HandDetail({ hand, onBack }: { hand: HandSummary; onBack: () => void }) {
  const h = hand
  return (
    <div className="ck-page ck-page--narrow" style={{ gap: 'var(--space-20)' }}>
      <button className="ck-back" onClick={onBack} type="button">
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="ck-page-header">
        <h1 className="ck-page-header__title">Hand #{h.handNumber}</h1>
        <p className="ck-page-header__subtitle">{formatDate(h.startTime)} · {formatTime(h.startTime)}</p>
      </div>

      <div className="endhand-winner-card">
        <div className="endhand-winner-card__top">
          <div className="endhand-winner-card__trophy">
            <Trophy size={28} />
          </div>
          <div className="endhand-winner-card__info">
            <span className="endhand-winner-card__name">{h.winner}</span>
            <span className="endhand-winner-card__badge">Winner</span>
          </div>
        </div>
        <div className="endhand-winner-card__divider" />
        <div className="endhand-winner-card__pot">
          <span className="endhand-winner-card__pot-label">Pot Won</span>
          <span className="endhand-winner-card__pot-value">₹{h.potWon.toLocaleString()}</span>
        </div>
      </div>

      <div className="endhand-summary-grid">
        <div className="endhand-summary-card">
          <div className="endhand-summary-card__icon"><Clock size={20} /></div>
          <span className="endhand-summary-card__label">Duration</span>
          <span className="endhand-summary-card__value">{formatDuration(h.duration)}</span>
        </div>
        <div className="endhand-summary-card">
          <div className="endhand-summary-card__icon"><Wallet size={20} /></div>
          <span className="endhand-summary-card__label">Pot</span>
          <span className="endhand-summary-card__value">₹{h.potWon.toLocaleString()}</span>
        </div>
        <div className="endhand-summary-card">
          <div className="endhand-summary-card__icon"><Users size={20} /></div>
          <span className="endhand-summary-card__label">Players</span>
          <span className="endhand-summary-card__value">{h.playersAtStart.length}</span>
        </div>
      </div>

      <Card>
        <h3 className="history-detail__title">Final Standings</h3>
        <div className="endhand-standings-list">
          {h.playersAtEnd.map((p) => (
            <div key={p.name} className="endhand-standing-card">
              <Avatar name={p.name} size="sm" />
              <div className="endhand-standing-card__info">
                <span className="endhand-standing-card__name">{p.name}</span>
                <span className="endhand-standing-card__chips">₹{p.chips.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default function History() {
  const navigate = useNavigate()
  const [selectedHand, setSelectedHand] = useState<HandSummary | null>(null)
  const hands = timeline.getCompletedHands().reverse()

  if (selectedHand) {
    return <HandDetail hand={selectedHand} onBack={() => setSelectedHand(null)} />
  }

  return (
    <div className="ck-page ck-page--narrow" style={{ gap: 'var(--space-20)' }}>
      <button className="ck-back" onClick={() => navigate('/')} type="button">
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="ck-page-header">
        <h1 className="ck-page-header__title">Hand History</h1>
        <p className="ck-page-header__subtitle">Completed hands</p>
      </div>

      {hands.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-32) 0' }}>
          <p style={{ color: 'var(--text-muted)' }}>No completed hands yet.</p>
        </div>
      )}

      <div className="player-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-10)' }}>
        {hands.map((h) => (
          <div
            key={`${h.handNumber}-${h.endTime}`}
            className="endhand-standing-card"
            onClick={() => setSelectedHand(h)}
            style={{ cursor: 'pointer' }}
          >
            <div className="action-sheet-item__icon" style={{ background: 'var(--primary-muted)', color: 'var(--primary)' }}>
              <Trophy size={18} />
            </div>
            <div className="endhand-standing-card__info">
              <span className="endhand-standing-card__name">Hand #{h.handNumber}</span>
              <span className="endhand-standing-card__chips">
                Winner: {h.winner} · ₹{h.potWon.toLocaleString()} · {formatDuration(h.duration)}
              </span>
            </div>
            <ArrowUpDown size={16} style={{ color: 'var(--text-disabled)', flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
