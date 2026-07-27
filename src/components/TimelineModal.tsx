import { useMemo } from 'react'
import { timeline } from '../utils/timeline'
import { X } from 'lucide-react'

interface TimelineModalProps {
  onClose: () => void
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const EVENT_STYLES: Record<string, string> = {
  bet: 'timeline-event__type--bet',
  pack: 'timeline-event__type--pack',
  see_cards: 'timeline-event__type--see_cards',
  side_show: 'timeline-event__type--side_show',
  show: 'timeline-event__type--show',
  winner: 'timeline-event__type--winner',
  new_hand: 'timeline-event__type--new_hand',
  game_started: 'timeline-event__type--game_started',
  undo: 'timeline-event__type--undo',
}

function getEventTypeClass(type: string): string {
  return EVENT_STYLES[type] ?? 'timeline-event__type--new_hand'
}

export function TimelineModal({ onClose }: TimelineModalProps) {
  const events = useMemo(() => timeline.getEvents(), [])

  return (
    <div className="ck-dialog-overlay" onClick={onClose} role="presentation">
      <div
        className="ck-dialog modal--timeline"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="ck-dialog__title">Timeline</h2>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="timeline-list">
          {events.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-16)' }}>
              No events yet.
            </p>
          )}

          {[...events].reverse().map((event, idx) => (
            <div className="timeline-event" key={`${event.timestamp}-${idx}`}>
              <span className="timeline-event__time">{formatTime(event.timestamp)}</span>
              <div className="timeline-event__body">
                <div className="timeline-event__header">
                  <span className="timeline-event__hand">#{event.handNumber}</span>
                  {event.playerName && (
                    <span className="timeline-event__player">{event.playerName}</span>
                  )}
                  <span className={`timeline-event__type ${getEventTypeClass(event.actionType)}`}>
                    {event.actionType.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="timeline-event__desc">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
