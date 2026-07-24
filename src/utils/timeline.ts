import type { ActivityEvent, HandSummary } from '../types/timeline'

const EVENTS_KEY = 'chipkeep-timeline-events'
const HANDS_KEY = 'chipkeep-timeline-hands'

class TimelineManagerImpl {
  private events: ActivityEvent[] = []
  private completedHands: HandSummary[] = []

  constructor() {
    this.load()
  }

  addEvent(data: Omit<ActivityEvent, 'id' | 'timestamp'>): void {
    const event: ActivityEvent = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }
    this.events.push(event)
    this.save()
  }

  getEvents(): ActivityEvent[] {
    return [...this.events]
  }

  completeHand(summary: Omit<HandSummary, 'duration'>): void {
    const full: HandSummary = {
      ...summary,
      duration: summary.endTime - summary.startTime,
    }
    this.completedHands.push(full)
    this.save()
  }

  getCompletedHands(): HandSummary[] {
    return [...this.completedHands]
  }

  clear(): void {
    this.events = []
    this.completedHands = []
    this.save()
  }

  private save(): void {
    try {
      localStorage.setItem(EVENTS_KEY, JSON.stringify(this.events))
      localStorage.setItem(HANDS_KEY, JSON.stringify(this.completedHands))
    } catch {
      // Storage unavailable - silently ignore
    }
  }

  private load(): void {
    try {
      const events = localStorage.getItem(EVENTS_KEY)
      if (events) {
        const parsed = JSON.parse(events)
        if (Array.isArray(parsed)) this.events = parsed
      }
      const hands = localStorage.getItem(HANDS_KEY)
      if (hands) {
        const parsed = JSON.parse(hands)
        if (Array.isArray(parsed)) this.completedHands = parsed
      }
    } catch {
      // Corrupted data - reset
      this.events = []
      this.completedHands = []
    }
  }
}

export const timeline = new TimelineManagerImpl()
