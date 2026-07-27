import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGame } from '../hooks/useGame'
import { GameHeader } from '../components/GameHeader'
import { TablePlayerCard } from '../components/TablePlayerCard'
import { BottomNav } from '../components/BottomNav'
import { OutcomeDialog } from '../components/OutcomeDialog'
import { EndHandSummary } from '../components/EndHandSummary'
import { TimelineModal } from '../components/TimelineModal'
import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'
import { BottomSheet } from '../components/ui/BottomSheet'
import { SectionHeader } from '../components/ui/SectionHeader'
import { canSideShow, getSideShowDisableReason } from '../engine/playerActionEngine'
import {
  countActivePlayers,
  getNextActiveIndex,
} from '../utils/turn'
import { validateBet } from '../utils/betting'
import { clearSavedGame } from '../utils/storage'
import { useMultiplayer } from '../hooks/useMultiplayer'
import { subscribeToGameState, writeGameState } from '../lib/gameSync'

type DialogState = 'none' | 'confirm-hand' | 'confirm-undo' | 'side-show' | 'show' | 'timeline' | 'menu'
type SheetView = 'closed' | 'menu' | 'bet'

const QUICK_BET_AMOUNTS = [10, 20, 50, 100, 500]
const POSITION_SLOTS = [0, 1, 2, 3, 4, 5]

export default function Game() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { game, startNewHand, dispatchAction, undo, canUndo, restoreGame, restoreGameState } = useGame()

  const [multiplayerLoading, setMultiplayerLoading] = useState(!!roomId)
  const [multiplayerError, setMultiplayerError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<DialogState>('none')
  const [sheetView, setSheetView] = useState<SheetView>('closed')
  const [endHandDismissed, setEndHandDismissed] = useState(false)
  const [betAmount, setBetAmount] = useState('')
  const [betError, setBetError] = useState<string | null>(null)
  const [lastStake, setLastStake] = useState(0)

  const stateLoadedRef = useRef(false)

  const [isHost, setIsHost] = useState(false)
  const [isCurrentPlayerTurn, setIsCurrentPlayerTurn] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const isHostRef = useRef(false)
  const isCurrentPlayerTurnRef = useRef(false)
  const hostIdRef = useRef<string | null>(null)
  const gameRef = useRef(game)
  const { uid } = useMultiplayer()
  const uidRef = useRef(uid)
  const isMultiplayer = !!roomId

  useEffect(() => { uidRef.current = uid }, [uid])
  useEffect(() => { gameRef.current = game }, [game])
  useEffect(() => { isCurrentPlayerTurnRef.current = isCurrentPlayerTurn }, [isCurrentPlayerTurn])

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const syncInProgressRef = useRef(false)
  const syncPendingRef = useRef(false)
  const debouncedSyncRef = useRef<(() => void) | null>(null)

  const { players, pot, handNumber, currentStake } = game

  const activePlayer = useMemo(() => {
    const idx = players.findIndex((p) => p.status === 'active')
    return idx >= 0 ? players[idx] : undefined
  }, [players])

  // Turn ownership: in multiplayer, only the player whose turn it is can act
  const controlsDisabled = isMultiplayer ? (!isCurrentPlayerTurn || syncing) : false

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [])

  const debouncedSync = useCallback(() => {
    if (!roomId || !isHostRef.current) return
    if (syncInProgressRef.current) {
      syncPendingRef.current = true
      return
    }
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }
    syncTimeoutRef.current = setTimeout(() => {
      syncTimeoutRef.current = null
      syncInProgressRef.current = true
      setSyncing(true)
      writeGameState(roomId, gameRef.current)
        .then(() => {
          syncInProgressRef.current = false
          setSyncing(false)
          if (syncPendingRef.current) {
            syncPendingRef.current = false
            debouncedSyncRef.current?.()
          }
        })
        .catch((err) => {
          syncInProgressRef.current = false
          setSyncing(false)
          const message = err instanceof Error ? err.message : 'Failed to sync game state'
          setMultiplayerError(message)
        })
    }, 300)
  }, [roomId])

  useEffect(() => {
    debouncedSyncRef.current = debouncedSync
  })

  useEffect(() => {
    if (!roomId) {
      stateLoadedRef.current = true
      return
    }

    clearSavedGame()

    const timeoutId = setTimeout(() => {
      if (!stateLoadedRef.current) {
        stateLoadedRef.current = true
        setMultiplayerError('Timed out waiting for game state.')
        setMultiplayerLoading(false)
      }
    }, 5000)

    const unsub = subscribeToGameState(roomId, (gameState, hostId) => {
      if (!stateLoadedRef.current) {
        if (gameState) {
          stateLoadedRef.current = true
          clearTimeout(timeoutId)
          if (hostId) {
            hostIdRef.current = hostId
            const host = uidRef.current === hostId
            setIsHost(host)
            isHostRef.current = host
          }
          restoreGame(gameState)
          setMultiplayerLoading(false)
        } else if (hostId === undefined) {
          stateLoadedRef.current = true
          clearTimeout(timeoutId)
          setMultiplayerError('Game data not found.')
          setMultiplayerLoading(false)
        }
      } else if (gameState) {
        if (!isHostRef.current) {
          restoreGameState(gameState)
        }
      } else {
        setMultiplayerError('Game data not found.')
      }
    })

    return () => {
      clearTimeout(timeoutId)
      unsub()
      stateLoadedRef.current = false
    }
  }, [roomId, restoreGame, restoreGameState])

  // Determine if current player's turn based on game state
  useEffect(() => {
    if (!isMultiplayer || !uid) {
      setIsCurrentPlayerTurn(true)
      return
    }
    const active = players.find((p) => p.status === 'active')
    setIsCurrentPlayerTurn(active?.id === uid)
  }, [players, uid, isMultiplayer])

  const hostExecute = useCallback(
    (action: () => void) => {
      if (!isMultiplayer) {
        action()
        return
      }
      if (!isHostRef.current) return
      action()
      debouncedSync()
    },
    [isMultiplayer, debouncedSync],
  )

  const handleStartHand = () => {
    if (isMultiplayer && !isHost) return
    hostExecute(() => {
      startNewHand()
      setEndHandDismissed(false)
      closeDialog()
    })
  }

  const handleSee = () => {
    if (!activePlayer) return
    if (isMultiplayer && !isCurrentPlayerTurnRef.current) return
    hostExecute(() => {
      dispatchAction({ type: 'SEE_CARDS', playerId: activePlayer.id })
      closeSheet()
    })
  }

  const handleBet = (amount: number) => {
    if (!activePlayer) return
    if (isMultiplayer && !isCurrentPlayerTurnRef.current) return
    hostExecute(() => {
      dispatchAction({ type: 'BET', playerId: activePlayer.id, amount })
      closeSheet()
    })
  }

  const handlePack = () => {
    if (!activePlayer) return
    if (isMultiplayer && !isCurrentPlayerTurnRef.current) return
    hostExecute(() => {
      setLastStake(currentStake)
      dispatchAction({ type: 'PACK', playerId: activePlayer.id })
      closeSheet()
    })
  }

  const handleSideShowResult = (loserId: string) => {
    if (!activePlayer || !sideShowOpponent) return
    if (isMultiplayer && !isCurrentPlayerTurnRef.current) return
    hostExecute(() => {
      setLastStake(currentStake)
      dispatchAction({
        type: 'SIDE_SHOW',
        playerId: activePlayer.id,
        opponentId: sideShowOpponent.id,
        loserId,
      })
      closeDialog()
    })
  }

  const handleShowResult = (winnerId: string) => {
    if (!activePlayer) return
    if (isMultiplayer && !isCurrentPlayerTurnRef.current) return
    hostExecute(() => {
      setLastStake(currentStake)
      dispatchAction({ type: 'SHOW', playerId: activePlayer.id, winnerId })
      closeDialog()
    })
  }

  const handleUndo = () => {
    if (isMultiplayer && !isHost) return
    hostExecute(() => {
      undo()
      setEndHandDismissed(false)
      closeSheet()
    })
  }

  const handleConfirmBet = () => {
    if (!activePlayer) return
    const value = Number(betAmount)
    const result = validateBet(activePlayer, value, currentStake)
    if (!result.valid) {
      setBetError(result.error)
      return
    }
    handleBet(value)
  }

  const handleRequestSideShow = () => {
    closeSheet()
    setDialog('side-show')
  }

  const handleRequestShow = () => {
    closeSheet()
    setDialog('show')
  }

  const playersWithPositions = useMemo(() => {
    if (players.length === 0) return []
    return players.map((player, i) => ({
      player,
      position: POSITION_SLOTS[i % POSITION_SLOTS.length],
    }))
  }, [players])

  const showPlayers = activePlayer
    ? players.filter((p) => p.status === 'active' || p.status === 'waiting')
    : []

  if (multiplayerLoading) {
    return (
      <div className="game-page">
        <GameHeader title="ChipKeep" subtitle="Loading Game..." onBack={() => navigate('/')} />
        <div className="game-empty">
          <div className="ck-btn__spinner" />
          <p className="game-empty__text" style={{ marginTop: 16 }}>Loading multiplayer game...</p>
        </div>
      </div>
    )
  }

  if (multiplayerError) {
    return (
      <div className="game-page">
        <GameHeader title="ChipKeep" subtitle="Error" onBack={() => navigate('/')} />
        <div className="game-empty">
          <p className="game-empty__text">{multiplayerError}</p>
          <Button variant="primary" fullWidth onClick={() => navigate('/')}>
            Return Home
          </Button>
        </div>
      </div>
    )
  }

  const activeIndex = players.findIndex((p) => p.status === 'active')
  const activeCount = countActivePlayers(players)

  const nextIndex = getNextActiveIndex(players, activeIndex)
  const sideShowOpponent = nextIndex >= 0 ? players[nextIndex] : undefined
  const sideShowAllowed =
    !!activePlayer &&
    !!sideShowOpponent &&
    canSideShow(activePlayer, sideShowOpponent, activeCount)
  const sideShowDisabledReason = getSideShowDisableReason(activePlayer, sideShowOpponent, activeCount)
  const showAllowed = !!activePlayer && activeCount === 2

  const winner = game.winnerId
    ? players.find((p) => p.id === game.winnerId) ?? null
    : null

  const dealerIndex = activeIndex
  const dealer = dealerIndex >= 0 ? players[dealerIndex] : undefined


  const closeDialog = () => setDialog('none')

  const openSheet = () => {
    setBetAmount(currentStake > 0 ? String(currentStake) : '')
    setBetError(null)
    setSheetView('menu')
  }

  const closeSheet = () => {
    setSheetView('closed')
    setBetError(null)
  }

  if (players.length === 0) {
    if (isMultiplayer) {
      return (
        <div className="game-page">
          <GameHeader title="ChipKeep" subtitle="Loading Game..." onBack={() => navigate('/')} />
          <div className="game-empty">
            <div className="ck-btn__spinner" />
            <p className="game-empty__text" style={{ marginTop: 16 }}>Waiting for game state...</p>
          </div>
        </div>
      )
    }
    return (
      <div className="game-page">
        <GameHeader
          title="ChipKeep"
          subtitle="No Game"
          onBack={() => navigate('/')}
        />
        <div className="game-empty">
          <p className="game-empty__text">No game in progress. Start a new game to begin.</p>
          <Button variant="primary" fullWidth onClick={() => navigate('/create')}>
            Create Game
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="game-page">
      <GameHeader
        title="ChipKeep"
        subtitle={handNumber > 0 ? `Current Hand #${handNumber}` : 'Game Setup'}
        onBack={() => navigate('/')}
        onMenu={() => setDialog('menu')}
      />

      <div className="game-table-wrapper">
        <div className="game-table">
          <div className="deco-chips">
            <div className="deco-chip deco-chip--1" />
            <div className="deco-chip deco-chip--2" />
            <div className="deco-chip deco-chip--3" />
          </div>

          {playersWithPositions.map(({ player, position }) => (
            <TablePlayerCard
              key={player.id}
              player={player}
              isDealer={player.id === dealer?.id}
              isCurrentTurn={player.status === 'active'}
              isWinner={player.id === game.winnerId}
              position={position}
            />
          ))}

          <div className="game-pot-center">
            <div className="game-pot-card">
              <span className="game-pot-card__label">Current Pot</span>
              <span className="game-pot-card__amount">
                ₹{pot.toLocaleString()}
              </span>
              <div className="game-pot-card__divider" />
              <div className="game-pot-card__meta-row">
                <span className="game-pot-card__meta-label">Current Stake</span>
                <span className="game-pot-card__meta-value">
                  ₹{currentStake.toLocaleString()}
                </span>
              </div>
              <div className="game-pot-card__meta-row">
                <span className="game-pot-card__meta-label">Dealer</span>
                <span className="game-pot-card__meta-value">
                  {dealer?.name ?? '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {(syncing && isMultiplayer) ? (
        <button className="game-fab game-fab--syncing" type="button" disabled>
          Syncing...
        </button>
      ) : (activePlayer && !game.handComplete && (
        <button
          className="game-fab"
          onClick={openSheet}
          type="button"
          disabled={controlsDisabled}
        >
          {isMultiplayer && !isCurrentPlayerTurn ? `Waiting for ${activePlayer.name}...` : 'Take Turn'}
        </button>
      ))}

      <Dialog
        open={dialog === 'confirm-hand'}
        title="Start New Hand?"
        description="This will reset the current hand."
        primaryLabel="Start"
        primaryAction={handleStartHand}
        secondaryLabel="Cancel"
        secondaryAction={closeDialog}
        onClose={closeDialog}
      />

      <Dialog
        open={dialog === 'confirm-undo'}
        title="Undo Last Action?"
        description="This will restore the game to the previous state."
        primaryLabel="Undo"
        primaryAction={handleUndo}
        secondaryLabel="Cancel"
        secondaryAction={closeDialog}
        onClose={closeDialog}
      />

      {dialog === 'side-show' && activePlayer && sideShowOpponent && (
        <OutcomeDialog
          title={`Side Show: ${activePlayer.name} vs ${sideShowOpponent.name}`}
          message="Select the winner. The loser will pack. No chips are added to the pot."
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
          onCancel={() => setDialog('none')}
        />
      )}

      {dialog === 'show' && activePlayer && (
        <OutcomeDialog
          title="Who won?"
          message="Winner takes the entire pot."
          options={showPlayers}
          optionLabel={(p) => p.name}
          onSelect={handleShowResult}
          onCancel={() => setDialog('none')}
        />
      )}

      {dialog === 'timeline' && (
        <TimelineModal onClose={closeDialog} />
      )}

      {dialog === 'menu' && (
        <div className="modal-overlay" onClick={closeDialog} role="presentation">
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h2 className="modal__title">Game Menu</h2>

            <div className="bet-actions">
              <Button variant="primary" fullWidth disabled={controlsDisabled} onClick={() => { setDialog('confirm-hand'); }}>
                New Hand
              </Button>
              <Button variant="secondary" fullWidth disabled={!canUndo || controlsDisabled} onClick={() => { setDialog('confirm-undo'); }}>
                Undo
              </Button>
              <Button variant="secondary" fullWidth onClick={() => { setDialog('timeline'); }}>
                Timeline
              </Button>
              <Button variant="secondary" fullWidth onClick={closeDialog}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {game.handComplete && !endHandDismissed && (
        <EndHandSummary
          winner={winner}
          potWon={game.potWon}
          players={players}
          currentStake={lastStake}
          handNumber={game.handNumber}
          onNextHand={handleStartHand}
          onReturn={() => setEndHandDismissed(true)}
          onViewHistory={() => setDialog('timeline')}
        />
      )}

      <BottomSheet open={sheetView !== 'closed'} onClose={closeSheet}>
        {sheetView === 'menu' && activePlayer && (
          <div className="action-sheet-list">
            <SectionHeader
              title="Choose Action"
              subtitle={`${activePlayer.name} · ${activePlayer.chips.toLocaleString()} chips`}
            />

            <button className={`action-sheet-item${controlsDisabled ? ' action-sheet-item--disabled' : ''}`} disabled={controlsDisabled} onClick={() => setSheetView('bet')} type="button">
              <span className="action-sheet-item__icon">B</span>
              <div className="action-sheet-item__content">
                <span className="action-sheet-item__title">Bet (Chaal)</span>
                <span className="action-sheet-item__desc">Place a wager to stay in the hand</span>
              </div>
            </button>

            <button className={`action-sheet-item${controlsDisabled ? ' action-sheet-item--disabled' : ''}`} disabled={controlsDisabled} onClick={handlePack} type="button">
              <span className="action-sheet-item__icon action-sheet-item__icon--danger">P</span>
              <div className="action-sheet-item__content">
                <span className="action-sheet-item__title">Pack (Fold)</span>
                <span className="action-sheet-item__desc">Fold your hand and exit</span>
              </div>
            </button>

            <button
              className={`action-sheet-item ${(!sideShowAllowed || controlsDisabled) ? 'action-sheet-item--disabled' : ''}`}
              disabled={!sideShowAllowed || controlsDisabled}
              onClick={handleRequestSideShow}
              type="button"
            >
              <span className="action-sheet-item__icon">S</span>
              <div className="action-sheet-item__content">
                <span className="action-sheet-item__title">Side Show</span>
                <span className="action-sheet-item__desc">{sideShowDisabledReason ?? 'Challenge a seen player to compare cards'}</span>
              </div>
            </button>

            <button
              className={`action-sheet-item ${(!showAllowed || controlsDisabled) ? 'action-sheet-item--disabled' : ''}`}
              disabled={!showAllowed || controlsDisabled}
              onClick={handleRequestShow}
              type="button"
            >
              <span className="action-sheet-item__icon">W</span>
              <div className="action-sheet-item__content">
                <span className="action-sheet-item__title">Show</span>
                <span className="action-sheet-item__desc">Reveal cards against the last active player</span>
              </div>
            </button>

            <button
              className={`action-sheet-item ${(activePlayer.seen || controlsDisabled) ? 'action-sheet-item--disabled' : ''}`}
              disabled={activePlayer.seen || controlsDisabled}
              onClick={handleSee}
              type="button"
            >
              <span className="action-sheet-item__icon">E</span>
              <div className="action-sheet-item__content">
                <span className="action-sheet-item__title">See Cards</span>
                <span className="action-sheet-item__desc">Look at your cards (Blind → Seen)</span>
              </div>
            </button>

            <button
              className={`action-sheet-item ${(!canUndo || controlsDisabled) ? 'action-sheet-item--disabled' : ''}`}
              disabled={!canUndo || controlsDisabled}
              onClick={handleUndo}
              type="button"
            >
              <span className="action-sheet-item__icon">U</span>
              <div className="action-sheet-item__content">
                <span className="action-sheet-item__title">Undo</span>
                <span className="action-sheet-item__desc">Undo the last action taken</span>
              </div>
            </button>

            <Button variant="secondary" fullWidth onClick={closeSheet}>
              Cancel
            </Button>
          </div>
        )}

        {sheetView === 'bet' && activePlayer && (
          <div className="bet-sheet">
            <SectionHeader title="Place Bet" subtitle={activePlayer.name} />

            <div className="bet-sheet__input">
              <label className="bet-sheet__label" htmlFor="betAmount">Amount</label>
              <input
                id="betAmount"
                type="number"
                className="ck-text-field__input"
                value={betAmount}
                onChange={(e) => {
                  setBetAmount(e.target.value)
                  setBetError(null)
                }}
                min={currentStake || 1}
                max={activePlayer.chips}
                placeholder="Enter amount"
                autoFocus
                disabled={controlsDisabled}
              />
            </div>

            <div className="quick-bets">
              {QUICK_BET_AMOUNTS.map((value) => (
                <Button
                  key={value}
                  variant="secondary"
                  disabled={controlsDisabled}
                  onClick={() => {
                    const base = Number(betAmount) || 0
                    setBetAmount(String(base + value))
                    setBetError(null)
                  }}
                >
                  +{value}
                </Button>
              ))}
            </div>

            {betError && <p className="error-text">{betError}</p>}

            <div className="bet-sheet__actions">
              <Button variant="secondary" fullWidth onClick={() => setSheetView('menu')}>
                Back
              </Button>
              <Button variant="primary" fullWidth disabled={controlsDisabled} onClick={handleConfirmBet}>
                Confirm Bet
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>

      <BottomNav
        activeTab="history"
        onHistory={() => navigate('/history')}
        onTimeline={() => setDialog('timeline')}
        onSettings={() => navigate('/settings')}
      />
    </div>
  )
}
