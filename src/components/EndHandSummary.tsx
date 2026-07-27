import { useMemo, useState, useEffect } from 'react'
import type { Player } from '../types/game'
import { timeline } from '../utils/timeline'
import { PartyPopper, Trophy, Clock, Wallet, Users, Eye, ArrowRight, Sparkles } from 'lucide-react'
import { Avatar } from './ui/Avatar'
import { Button } from './ui/Button'

interface EndHandSummaryProps {
  winner: Player | null
  potWon: number
  players: Player[]
  currentStake: number
  handNumber: number
  onNextHand: () => void
  onReturn: () => void
  onViewHistory: () => void
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}m ${secs}s`
}

function getBlindSeenLabel(player: Player): { label: string; variant: string } {
  if (player.status === 'folded' || player.status === 'out') {
    return { label: 'Packed', variant: 'packed' }
  }
  if (player.seen) {
    return { label: 'Seen', variant: 'seen' }
  }
  return { label: 'Blind', variant: 'blind' }
}

export function EndHandSummary({
  winner,
  potWon,
  players,
  currentStake,
  handNumber,
  onNextHand,
  onReturn,
  onViewHistory,
}: EndHandSummaryProps) {
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setShowDetails(true), 400)
      return () => clearTimeout(t)
    }
  }, [visible])

  const completedHands = useMemo(() => timeline.getCompletedHands(), [])
  const currentHand = completedHands.length > 0 ? completedHands[completedHands.length - 1] : null
  const duration = currentHand?.duration ? formatDuration(currentHand.duration) : '—'

  const playersRemaining = players.filter(
    (p) => p.status !== 'folded' && p.status !== 'out',
  ).length

  const chipLeaderId = useMemo(() => {
    let maxChips = -1
    let leaderId: string | null = null
    for (const p of players) {
      if (p.chips > maxChips) {
        maxChips = p.chips
        leaderId = p.id
      }
    }
    return leaderId
  }, [players])

  return (
    <div className="endhand-overlay">
      <div className="endhand-modal">
        <div className="endhand-confetti-layer">
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className="endhand-particle"
              style={{
                left: `${5 + (i * 6.2) % 90}%`,
                animationDelay: `${0.05 + (i * 0.08)}s`,
                animationDuration: `${1.2 + (i % 3) * 0.3}s`,
                background: ['var(--gold)', 'var(--primary)', 'var(--danger)', 'var(--success)', '#D97706'][i % 5],
                width: `${5 + (i % 3) * 2}px`,
                height: `${5 + (i % 3) * 2}px`,
                borderRadius: i % 3 === 0 ? '50%' : '2px',
              }}
            />
          ))}
        </div>

        <div className={`endhand-modal__header ${visible ? 'endhand-modal__header--visible' : ''}`}>
          <div className="endhand-modal__icon">
            <Trophy size={28} />
          </div>
          <h2 className="endhand-modal__title">Hand #{handNumber}</h2>
          <p className="endhand-modal__subtitle">Winner!</p>
        </div>

        {winner && (
          <div className={`endhand-modal__winner ${visible ? 'endhand-modal__winner--visible' : ''}`}>
            <div className="endhand-modal__winner-avatar">
              <div className="endhand-modal__winner-ring">
                <Avatar name={winner.name} size="xl" winnerRing />
              </div>
              <div className="endhand-modal__crown">
                <Sparkles size={14} />
              </div>
            </div>
            <h3 className="endhand-modal__winner-name">{winner.name}</h3>
            <div className="endhand-modal__winner-chips">
              <span className="endhand-modal__winner-chips-value">
                +₹{potWon.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <div className={`endhand-modal__stats ${showDetails ? 'endhand-modal__stats--visible' : ''}`}>
          <div className="endhand-modal__stat">
            <Wallet size={14} />
            <span className="endhand-modal__stat-label">Pot</span>
            <span className="endhand-modal__stat-value">₹{potWon.toLocaleString()}</span>
          </div>
          <div className="endhand-modal__stat">
            <Clock size={14} />
            <span className="endhand-modal__stat-label">Duration</span>
            <span className="endhand-modal__stat-value">{duration}</span>
          </div>
          <div className="endhand-modal__stat">
            <Users size={14} />
            <span className="endhand-modal__stat-label">Remaining</span>
            <span className="endhand-modal__stat-value">{playersRemaining}/{players.length}</span>
          </div>
        </div>

        <div className={`endhand-modal__standings ${showDetails ? 'endhand-modal__standings--visible' : ''}`}>
          {players.map((player, idx) => {
            const isWinner = player.id === winner?.id
            const isChipLeader = player.id === chipLeaderId
            const isPacked = player.status === 'folded' || player.status === 'out'
            const statusInfo = getBlindSeenLabel(player)

            return (
              <div
                key={player.id}
                className={`endhand-standing-row ${isWinner ? 'endhand-standing-row--winner' : ''} ${isPacked ? 'endhand-standing-row--packed' : ''}`}
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <div className="endhand-standing-row__left">
                  <Avatar name={player.name} size="sm" />
                  <div className="endhand-standing-row__info">
                    <span className="endhand-standing-row__name">{player.name}</span>
                    <span className="endhand-standing-row__meta">
                      ₹{player.chips.toLocaleString()}
                      {isPacked && ' · Packed'}
                      {isChipLeader && !isWinner && ' · Leader'}
                    </span>
                  </div>
                </div>
                <div className="endhand-standing-row__right">
                  {isWinner && (
                    <span className="endhand-standing-row__badge endhand-standing-row__badge--winner">
                      <Trophy size={10} />
                      Won
                    </span>
                  )}
                  <span className={`endhand-standing-row__bs endhand-standing-row__bs--${statusInfo.variant}`}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div className={`endhand-modal__actions ${showDetails ? 'endhand-modal__actions--visible' : ''}`}>
          <Button variant="primary" fullWidth onClick={onNextHand}>
            <ArrowRight size={16} />
            Next Hand
          </Button>
          <div className="endhand-modal__actions-secondary">
            <Button variant="ghost" fullWidth onClick={onReturn}>
              <Eye size={16} />
              Return to Table
            </Button>
            <Button variant="ghost" fullWidth onClick={onViewHistory}>
              <Clock size={16} />
              History
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
