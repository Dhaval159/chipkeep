import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { HandSummary } from '../types/timeline'
import { timeline } from '../utils/timeline'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SectionHeader } from '../components/ui/SectionHeader'

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
        <Button
          variant="secondary"
          onClick={() => setSelectedHand(null)}
          style={{ alignSelf: 'flex-start' }}
        >
          ← Back
        </Button>

        <SectionHeader title={`Hand #${h.handNumber}`} />

        <Card>
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
        </Card>

        <Card>
          <h3 className="history-detail__title">Final Standings</h3>
          {h.playersAtEnd.map((p) => (
            <div className="history-detail__row" key={p.name}>
              <span className="history-detail__label">{p.name}</span>
              <span className="history-detail__value">{p.chips.toLocaleString()} chips</span>
            </div>
          ))}
        </Card>
      </div>
    )
  }

  return (
    <div className="home-container">
      <Button
        variant="secondary"
        onClick={() => navigate('/')}
        style={{ alignSelf: 'flex-start' }}
      >
        ← Back
      </Button>

      <SectionHeader title="Hand History" subtitle="Completed hands" />

      {hands.length === 0 && (
        <p className="subtitle">No completed hands yet.</p>
      )}

      <div className="player-list">
        {hands.map((h) => (
          <Card
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
          </Card>
        ))}
      </div>
    </div>
  )
}
