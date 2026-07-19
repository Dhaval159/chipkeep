import type { Player } from '../types/game'

export interface BetValidationResult {
  valid: boolean
  error: string | null
}

export function validateBet(
  player: Player,
  amount: number,
  currentStake: number,
): BetValidationResult {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { valid: false, error: 'Enter a valid amount' }
  }
  if (amount < currentStake) {
    return { valid: false, error: `Amount must be at least ${currentStake}` }
  }
  if (amount > player.chips) {
    return { valid: false, error: 'Not enough chips' }
  }
  return { valid: true, error: null }
}

export function applyBet(players: Player[], playerId: string, amount: number): Player[] {
  return players.map((player) =>
    player.id === playerId
      ? { ...player, chips: player.chips - amount }
      : player,
  )
}
