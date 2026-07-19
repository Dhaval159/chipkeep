import type { GameState, Player, PlayerAction } from '../types/game'
import { applyBet, validateBet } from '../utils/betting'
import {
  countActivePlayers,
  getNextActiveIndex,
  isEligibleForTurn,
  setActivePlayer,
} from '../utils/turn'

function advanceTurnFrom(state: GameState, actingPlayerId: string): GameState {
  const actingIndex = state.players.findIndex((p) => p.id === actingPlayerId)
  const nextIndex = getNextActiveIndex(state.players, actingIndex)
  if (nextIndex === -1) {
    return state
  }
  return { ...state, players: setActivePlayer(state.players, nextIndex) }
}

function awardPot(state: GameState, winnerId: string): GameState {
  return {
    ...state,
    players: state.players.map((p) =>
      p.id === winnerId ? { ...p, chips: p.chips + state.pot, status: 'waiting' } : p,
    ),
    handComplete: true,
    winnerId,
    potWon: state.pot,
    pot: 0,
    currentStake: 0,
    lastBet: 0,
  }
}

// Auto-declare the winner when a single active player remains.
function settleIfWon(state: GameState): GameState {
  if (state.handComplete) {
    return state
  }
  const remaining = state.players.filter(isEligibleForTurn)
  if (remaining.length === 1) {
    return awardPot(state, remaining[0].id)
  }
  return state
}

function handleBet(state: GameState, playerId: string, amount: number): GameState {
  const player = state.players.find((p) => p.id === playerId)
  if (!player || player.status !== 'active') {
    return state
  }
  if (!validateBet(player, amount, state.currentStake).valid) {
    return state
  }

  const betState: GameState = {
    ...state,
    players: applyBet(state.players, playerId, amount),
    pot: state.pot + amount,
    currentStake: amount,
    lastBet: amount,
  }

  return advanceTurnFrom(betState, playerId)
}

function handlePack(state: GameState, playerId: string): GameState {
  const player = state.players.find((p) => p.id === playerId)
  if (!player) {
    return state
  }

  const packedState: GameState = {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, status: 'folded' } : p,
    ),
  }

  const advanced = advanceTurnFrom(packedState, playerId)
  return settleIfWon(advanced)
}

function handleSeeCards(state: GameState, playerId: string): GameState {
  const player = state.players.find((p) => p.id === playerId)
  if (!player || player.seen) {
    return state
  }
  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, seen: true } : p,
    ),
  }
}

export function canSideShow(requester: Player, opponent: Player): boolean {
  return (
    requester.status === 'active' &&
    requester.seen &&
    opponent.seen &&
    isEligibleForTurn(opponent) &&
    requester.id !== opponent.id
  )
}

function handleSideShow(
  state: GameState,
  playerId: string,
  opponentId: string,
  loserId: string,
): GameState {
  const requester = state.players.find((p) => p.id === playerId)
  const opponent = state.players.find((p) => p.id === opponentId)
  if (!requester || !opponent || !canSideShow(requester, opponent)) {
    return state
  }
  if (loserId !== playerId && loserId !== opponentId) {
    return state
  }

  const cost = state.currentStake
  if (cost > requester.chips) {
    return state
  }

  const sideShowState: GameState = {
    ...state,
    players: state.players.map((p) => {
      if (p.id === playerId) {
        return { ...p, chips: p.chips - cost }
      }
      if (p.id === loserId) {
        return { ...p, status: 'folded' }
      }
      return p
    }),
    pot: state.pot + cost,
  }

  // If the requester lost, advance to the next player; otherwise the
  // requester keeps the turn since the opponent was eliminated.
  const advanced =
    loserId === playerId
      ? advanceTurnFrom(sideShowState, playerId)
      : sideShowState
  return settleIfWon(advanced)
}

function handleShow(state: GameState, playerId: string, winnerId: string): GameState {
  const requester = state.players.find((p) => p.id === playerId)
  const winner = state.players.find((p) => p.id === winnerId)
  if (!requester || !winner || requester.status !== 'active') {
    return state
  }
  if (countActivePlayers(state.players) !== 2) {
    return state
  }
  if (!isEligibleForTurn(winner)) {
    return state
  }

  return awardPot(state, winnerId)
}

/**
 * The single place where chips, pot, player status, seen state, and turn
 * change. UI dispatches actions; this pure reducer produces the next state.
 */
export function playerActionReducer(
  state: GameState,
  action: PlayerAction,
): GameState {
  if (state.handComplete) {
    return state
  }

  switch (action.type) {
    case 'BET':
      return handleBet(state, action.playerId, action.amount)
    case 'PACK':
      return handlePack(state, action.playerId)
    case 'SEE_CARDS':
      return handleSeeCards(state, action.playerId)
    case 'SIDE_SHOW':
      return handleSideShow(
        state,
        action.playerId,
        action.opponentId,
        action.loserId,
      )
    case 'SHOW':
      return handleShow(state, action.playerId, action.winnerId)
    default:
      return state
  }
}
