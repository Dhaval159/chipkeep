import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PlayerStatus } from '../types/game'
import { useGame } from '../hooks/useGame'
import { ActionsModal } from '../components/ActionsModal'
import { OutcomeDialog } from '../components/OutcomeDialog'
import { EndHandDialog } from '../components/EndHandDialog'
import { TimelineModal } from '../components/TimelineModal'
import { canSideShow } from '../engine/playerActionEngine'
import {
  countActivePlayers,
  getPreviousActiveIndex,
} from '../utils/turn'

const STATUS_LABELS: Record<PlayerStatus, string> = {
  waiting: 'Waiting',
  active: 'Active Turn',
  folded: 'Packed',
  out: 'Eliminated',
}

type Dialog = 'none' | 'confirm-hand' | 'actions' | 'side-show' | 'show' | 'confirm-undo' | 'timeline'

export default function Game() {
  const navigate = useNavigate()
  const { game, startNewHand, dispatchAction, undo, canUndo } = useGame()
  const [dialog, setDialog] = useState<Dialog>('none')
  const [endHandDismissed, setEndHandDismissed] = useState(false)

  const { players, pot, handNumber, currentStake } = game
  const activeIndex = players.findIndex((p) => p.status === 'active')
  const activePlayer = activeIndex >= 0 ? players[activeIndex] : undefined
  const activeCount = countActivePlayers(players)

  const prevIndex = getPreviousActiveIndex(players, activeIndex)
  const sideShowOpponent = prevIndex >= 0 ? players[prevIndex] : undefined
  const sideShowAllowed =
    !!activePlayer &&
    !!sideShowOpponent &&
    canSideShow(activePlayer, sideShowOpponent)
  const showAllowed = !!activePlayer && activeCount === 2

  const winner = game.winnerId
    ? players.find((p) => p.id === game.winnerId) ?? null
    : null

  const closeDialog = () => setDialog('none')

  const handleStartHand = () => {
    startNewHand()
    setEndHandDismissed(false)
    closeDialog()
  }

  const handleSee = () => {
    if (!activePlayer) return
    dispatchAction({ type: 'SEE_CARDS', playerId: activePlayer.id })
    closeDialog()
  }

  const handleBet = (amount: number) => {
    if (!activePlayer) return
    dispatchAction({ type: 'BET', playerId: activePlayer.id, amount })
    closeDialog()
  }

  const handlePack = () => {
    if (!activePlayer) return
    dispatchAction({ type: 'PACK', playerId: activePlayer.id })
    closeDialog()
  }

  const handleSideShowResult = (loserId: string) => {
    if (!activePlayer || !sideShowOpponent) return
    dispatchAction({
      type: 'SIDE_SHOW',
      playerId: activePlayer.id,
      opponentId: sideShowOpponent.id,
      loserId,
    })
    closeDialog()
  }

  const handleShowResult = (winnerId: string) => {
    if (!activePlayer) return
    dispatchAction({ type: 'SHOW', playerId: activePlayer.id, winnerId })
    closeDialog()
  }

  const handleUndo = () => {
    undo()
    setEndHandDismissed(false)
    closeDialog()
  }

  if (players.length === 0) {
    return (
      <div className="home-container">
        <div className="game-appbar">
          <button
            type="button"
            className="back-button"
            onClick={() => navigate('/')}
          >
            ← Back
          </button>
          <h1 className="game-appbar__title">Current Game</h1>
          <button
            type="button"
            className="game-appbar__menu"
            aria-label="Menu"
            disabled
          >
            ⋯
          </button>
        </div>

        <p className="subtitle">
          No game in progress. Start a new game to begin.
        </p>
        <button
          type="button"
          className="btn btn-primary btn-full"
          onClick={() => navigate('/create')}
        >
          Create Game
        </button>
      </div>
    )
  }

  const showPlayers = activePlayer
    ? players.filter((p) => p.status === 'active' || p.status === 'waiting')
    : []

  return (
    <div className="home-container">
      <div className="game-appbar">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate('/')}
        >
          ← Back
        </button>
        <h1 className="game-appbar__title">Current Game</h1>
        <button
          type="button"
          className="game-appbar__menu"
          aria-label="Menu"
          disabled
        >
          ⋯
        </button>
      </div>

      <div className="pot-card">
        <span className="pot-card__label">Current Pot</span>
        <span className="pot-card__amount">{pot.toLocaleString()}</span>
        <span className="pot-card__unit">Chips</span>
        <div className="pot-card__meta">
          <span>Stake {currentStake.toLocaleString()}</span>
          <span>Active {activeCount}</span>
        </div>
        <div className="pot-card__meta">
          <span>Hand #{handNumber || '—'}</span>
          <span>Turn: {activePlayer?.name ?? '—'}</span>
        </div>
      </div>

      {handNumber > 0 && (
        <div className="hand-banner">
          <span className="hand-banner__label">Current Hand</span>
          <span className="hand-banner__value">Hand #{handNumber}</span>
        </div>
      )}

      <div className="player-list">
        {players.map((player) => (
          <div
            className={`game-player-card${
              player.status === 'active' ? ' game-player-card--active' : ''
            }`}
            key={player.id}
          >
            <div className="game-player-card__avatar" aria-hidden="true">
              {player.name.charAt(0).toUpperCase()}
            </div>
            <div className="game-player-card__info">
              <span className="game-player-card__name">{player.name}</span>
              <span className="game-player-card__chips">
                {player.chips.toLocaleString()} Chips ·{' '}
                {player.seen ? 'Seen' : 'Blind'}
              </span>
            </div>
            {player.status === 'active' && (
              <span className="turn-badge">YOUR TURN</span>
            )}
            <span className={`status-badge status-badge--${player.status}`}>
              {STATUS_LABELS[player.status]}
            </span>
          </div>
        ))}
      </div>

      {activePlayer && (
        <button
          type="button"
          className="btn btn-primary btn-full"
          onClick={() => setDialog('actions')}
        >
          Actions
        </button>
      )}

      <div className="game-action-bar">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setDialog('confirm-hand')}
        >
          New Hand
        </button>
        <button
          type="button"
          className="btn"
          disabled={!canUndo}
          onClick={() => setDialog('confirm-undo')}
        >
          Undo
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => setDialog('timeline')}
        >
          Timeline
        </button>
        <button type="button" className="btn" disabled>
          Settings
        </button>
      </div>

      {dialog === 'confirm-hand' && (
        <div
          className="modal-overlay"
          onClick={closeDialog}
          role="presentation"
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h2 className="modal__title">Start New Hand?</h2>
            <p className="subtitle">This will reset the current hand.</p>

            <div className="modal__actions">
              <button type="button" className="btn" onClick={closeDialog}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStartHand}
              >
                Start
              </button>
            </div>
          </div>
        </div>
      )}

      {dialog === 'confirm-undo' && (
        <div
          className="modal-overlay"
          onClick={closeDialog}
          role="presentation"
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h2 className="modal__title">Undo Last Action?</h2>
            <p className="subtitle">
              This will restore the game to the previous state.
            </p>

            <div className="modal__actions">
              <button type="button" className="btn" onClick={closeDialog}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUndo}
              >
                Undo
              </button>
            </div>
          </div>
        </div>
      )}

      {dialog === 'actions' && activePlayer && (
        <ActionsModal
          player={activePlayer}
          currentStake={currentStake}
          canSideShow={sideShowAllowed}
          canShow={showAllowed}
          onSee={handleSee}
          onBet={handleBet}
          onPack={handlePack}
          onRequestSideShow={() => setDialog('side-show')}
          onRequestShow={() => setDialog('show')}
          onClose={closeDialog}
        />
      )}

      {dialog === 'side-show' && activePlayer && sideShowOpponent && (
        <OutcomeDialog
          title="Who won the Side Show?"
          message={`${activePlayer.name} vs ${sideShowOpponent.name}. The loser packs.`}
          cost={currentStake}
          options={[activePlayer, sideShowOpponent]}
          optionLabel={(p) =>
            p.id === activePlayer.id
              ? `${sideShowOpponent.name} loses`
              : `${activePlayer.name} loses`
          }
          onSelect={(winnerId) => {
            const loserId =
              winnerId === activePlayer.id
                ? sideShowOpponent.id
                : activePlayer.id
            handleSideShowResult(loserId)
          }}
          onCancel={() => setDialog('actions')}
        />
      )}

      {dialog === 'show' && activePlayer && (
        <OutcomeDialog
          title="Who won?"
          message="Winner takes the entire pot."
          options={showPlayers}
          optionLabel={(p) => p.name}
          onSelect={handleShowResult}
          onCancel={() => setDialog('actions')}
        />
      )}

      {dialog === 'timeline' && (
        <TimelineModal onClose={closeDialog} />
      )}

      {game.handComplete && !endHandDismissed && (
        <EndHandDialog
          winner={winner}
          potWon={game.potWon}
          players={players}
          onNextHand={handleStartHand}
          onReturn={() => setEndHandDismissed(true)}
        />
      )}
    </div>
  )
}
