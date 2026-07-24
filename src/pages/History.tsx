import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { HandSummary } from '../types/timeline'
import { timeline } from '../utils/timeline'

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

export default function History() {
  const navigate = useNavigate()
  const [selectedHand, setSelectedHand] = useState<HandSummary | null>(null)
  const hands = timeline.getCompletedHands().reverse()

  if (selectedHand) {
    const h = selectedHand
    return (
      <div className="home-container">
        <button
          type="button"
          className="back-button"
          onClick={() => setSelectedHand(null)}
        >
          ← Back
        </button>

        <header className="header" style={{ marginTop: 0, textAlign: 'left' }}>
          <h1 className="logo">Hand #{h.handNumber}</h1>
        </header>

        <div className="history-detail">
          <div className="history-detail__row">
            <span className="history-detail__label">Winner</span>
            <span className="history-detail__value">{h.winner}</span>
          </div>
          <div className="history-detail__row">
            <span className="history-detail__label">Pot Won</span>
            <span className="history-detail__value">{h.potWon.toLocaleString()} chips</span>
          </div>
          <div className="history-detail__row">
            <span className="history-detail__label">Players at Start</span>
            <span className="history-detail__value">{h.playersAtStart.join(', ')}</span>
          </div>
          <div className="history-detail__row">
            <span className="history-detail__label">Start Time</span>
            <span className="history-detail__value">{formatDate(h.startTime)} {formatTime(h.startTime)}</span>
          </div>
          <div className="history-detail__row">
            <span className="history-detail__label">End Time</span>
            <span className="history-detail__value">{formatDate(h.endTime)} {formatTime(h.endTime)}</span>
          </div>
          <div className="history-detail__row">
            <span className="history-detail__label">Duration</span>
            <span className="history-detail__value">{formatDuration(h.duration)}</span>
          </div>
        </div>

        <div className="history-detail">
          <h3 className="history-detail__title">Final Standings</h3>
          {h.playersAtEnd.map((p) => (
            <div className="history-detail__row" key={p.name}>
              <span className="history-detail__label">{p.name}</span>
              <span className="history-detail__value">{p.chips.toLocaleString()} chips</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="home-container">
      <button
        type="button"
        className="back-button"
        onClick={() => navigate('/')}
      >
        ← Back
      </button>

      <header className="header" style={{ marginTop: 0, textAlign: 'left' }}>
        <h1 className="logo">Hand History</h1>
        <p className="subtitle">Completed hands</p>
      </header>

      {hands.length === 0 && (
        <p className="subtitle">No completed hands yet.</p>
      )}

      <div className="player-list">
        {hands.map((h) => (
          <button
            type="button"
            className="player-card"
            key={`${h.handNumber}-${h.endTime}`}
            onClick={() => setSelectedHand(h)}
            style={{ cursor: 'pointer', textAlign: 'left', width: '100%' }}
          >
            <div>
              <div className="player-card__name">
                Hand #{h.handNumber}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                Winner: {h.winner} · {h.potWon.toLocaleString()} chips · {formatDuration(h.duration)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
