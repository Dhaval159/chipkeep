export interface ActivityEvent {
  id: string
  timestamp: number
  handNumber: number
  playerName: string | null
  actionType: string
  description: string
}

export interface HandSummary {
  handNumber: number
  winner: string
  potWon: number
  playersAtStart: string[]
  playersAtEnd: { name: string; chips: number }[]
  startTime: number
  endTime: number
  duration: number
}
