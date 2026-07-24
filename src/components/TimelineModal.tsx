import { timeline } from '../utils/timeline'

interface TimelineModalProps {
  onClose: () => void
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function TimelineModal({ onClose }: TimelineModalProps) {
  const events = timeline.getEvents().reverse()

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal modal--timeline"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2 className="modal__title">Activity Timeline</h2>

        <div className="timeline-list">
          {events.length === 0 && (
            <p className="subtitle">No events yet.</p>
          )}
          {events.map((event) => (
            <div className="timeline-event" key={event.id}>
              <div className="timeline-event__time">
                {formatTime(event.timestamp)}
              </div>
              <div className="timeline-event__body">
                <div className="timeline-event__header">
                  {event.handNumber > 0 && (
                    <span className="timeline-event__hand">
                      Hand #{event.handNumber}
                    </span>
                  )}
                  {event.playerName && (
                    <span className="timeline-event__player">
                      {event.playerName}
                    </span>
                  )}
                  <span className={`timeline-event__type timeline-event__type--${event.actionType.toLowerCase()}`}>
                    {event.actionType.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="timeline-event__desc">{event.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="modal__actions">
          <button type="button" className="btn btn-primary btn-full" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
