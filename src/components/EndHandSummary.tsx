import { useMemo } from 'react'
import type { Player } from '../types/game'
import { timeline } from '../utils/timeline'
import { PartyPopper, Trophy, Clock, Wallet, ArrowUpDown, Users, UserCheck, CircleDollarSign } from 'lucide-react'
import { Avatar } from './ui/Avatar'

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

function WinnerCard({ winner, potWon }: { winner: Player | null; potWon: number }) {
  return (
    <div className="endhand-winner-card">
      <div className="endhand-winner-card__top">
        <div className="endhand-winner-card__avatar-wrapper">
          {winner && <Avatar name={winner.name} size="xl" />}
        </div>
        <div className="endhand-winner-card__info">
          <span className="endhand-winner-card__name">{winner?.name ?? '—'}</span>
          <span className="endhand-winner-card__badge">Winner</span>
        </div>
        <div className="endhand-winner-card__trophy">
          <Trophy size={28} />
        </div>
      </div>

      <div className="endhand-winner-card__divider" />

      <div className="endhand-winner-card__pot">
        <span className="endhand-winner-card__pot-label">Pot Won</span>
        <span className="endhand-winner-card__pot-value">₹{potWon.toLocaleString()}</span>
      </div>

      {winner && (
        <div className="endhand-winner-card__total">
          <span className="endhand-winner-card__total-label">Current Total Chips</span>
          <span className="endhand-winner-card__total-value">₹{winner.chips.toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="endhand-summary-card">
      <div className="endhand-summary-card__icon">{icon}</div>
      <span className="endhand-summary-card__label">{label}</span>
      <span className="endhand-summary-card__value">{value}</span>
    </div>
  )
}

function PlayerStandingCard({
  player,
  isWinner,
  isDealer,
  isChipLeader,
}: {
  player: Player
  isWinner: boolean
  isDealer: boolean
  isChipLeader: boolean
}) {
  const isPacked = player.status === 'folded' || player.status === 'out'
  const statusInfo = getBlindSeenLabel(player)

  return (
    <div className={`endhand-standing-card ${isWinner ? 'endhand-standing-card--winner' : ''} ${isPacked ? 'endhand-standing-card--packed' : ''}`}>
      <div className="endhand-standing-card__avatar">
        <Avatar name={player.name} size="md" />
      </div>
      <div className="endhand-standing-card__info">
        <span className="endhand-standing-card__name">{player.name}</span>
        <span className="endhand-standing-card__chips">₹{player.chips.toLocaleString()}</span>
      </div>
      <div className="endhand-standing-card__status-area">
        <div className="endhand-standing-card__badges">
          {isWinner && <span className="endhand-standing-card__badge endhand-standing-card__badge--winner">Winner</span>}
          {isChipLeader && !isWinner && <span className="endhand-standing-card__badge endhand-standing-card__badge--leader">Chip Leader</span>}
          {isDealer && !isWinner && <span className="endhand-standing-card__badge endhand-standing-card__badge--dealer">Dealer</span>}
          {isPacked && <span className="endhand-standing-card__badge endhand-standing-card__badge--packed">Packed</span>}
        </div>
        <span className={`endhand-standing-card__bs endhand-standing-card__bs--${statusInfo.variant}`}>
          {statusInfo.label}
        </span>
      </div>
    </div>
  )
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
  const completedHands = useMemo(() => timeline.getCompletedHands(), [])
  const currentHand = completedHands.length > 0 ? completedHands[completedHands.length - 1] : null

  const duration = currentHand?.duration
    ? formatDuration(currentHand.duration)
    : '—'

  const playersRemaining = players.filter(
    (p) => p.status !== 'folded' && p.status !== 'out',
  ).length

  const dealerName = useMemo(() => {
    const firstRemaining = players.find(
      (p) => p.status !== 'folded' && p.status !== 'out',
    )
    return firstRemaining?.name ?? '—'
  }, [players])

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
      <div className="endhand-page">

        <div className="endhand-header">
          <div className="endhand-header__icon">
            <PartyPopper size={28} />
          </div>
          <h1 className="endhand-header__title">Hand #{handNumber} Complete</h1>
          <p className="endhand-header__subtitle">Round finished successfully</p>
        </div>

        <WinnerCard winner={winner} potWon={potWon} />

        <section className="endhand-section">
          <h2 className="endhand-section__title">Game Summary</h2>
          <div className="endhand-summary-grid">
            <SummaryCard icon={<Clock size={20} />} label="Hand Duration" value={duration} />
            <SummaryCard icon={<Wallet size={20} />} label="Current Pot" value={`₹${potWon.toLocaleString()}`} />
            <SummaryCard icon={<ArrowUpDown size={20} />} label="Total Bets" value={`₹${potWon.toLocaleString()}`} />
            <SummaryCard icon={<Users size={20} />} label="Players Remaining" value={String(playersRemaining)} />
            <SummaryCard icon={<UserCheck size={20} />} label="Dealer" value={dealerName} />
            <SummaryCard icon={<CircleDollarSign size={20} />} label="Current Boot Amount" value={`₹${currentStake.toLocaleString()}`} />
          </div>
        </section>

        <section className="endhand-section endhand-section--standings">
          <h2 className="endhand-section__title">Player Standings</h2>
          <div className="endhand-standings-list">
            {players.map((player) => (
              <PlayerStandingCard
                key={player.id}
                player={player}
                isWinner={player.id === winner?.id}
                isDealer={player.name === dealerName && player.id !== winner?.id}
                isChipLeader={player.id === chipLeaderId}
              />
            ))}
          </div>
        </section>

        <div className="endhand-spacer" />
      </div>

      <div className="endhand-bottom-bar">
        <button className="endhand-bottom-bar__primary" onClick={onNextHand} type="button">
          Start Next Hand
        </button>
        <button className="endhand-bottom-bar__secondary" onClick={onReturn} type="button">
          Return to Table
        </button>
        <button className="endhand-bottom-bar__text" onClick={onViewHistory} type="button">
          View Hand History
        </button>
      </div>
    </div>
  )
}
