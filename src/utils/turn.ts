import type { Player } from '../types/game'

export function isEligibleForTurn(player: Player): boolean {
  return player.status !== 'folded' && player.status !== 'out'
}

export function getFirstActiveIndex(players: Player[]): number {
  return players.findIndex(isEligibleForTurn)
}

export function getNextActiveIndex(
  players: Player[],
  currentIndex: number,
): number {
  const count = players.length
  if (count === 0) {
    return -1
  }

  for (let step = 1; step <= count; step++) {
    const index = (currentIndex + step) % count
    if (isEligibleForTurn(players[index])) {
      return index
    }
  }

  return currentIndex >= 0 && isEligibleForTurn(players[currentIndex])
    ? currentIndex
    : -1
}

export function getPreviousActiveIndex(
  players: Player[],
  currentIndex: number,
): number {
  const count = players.length
  if (count === 0 || currentIndex < 0) {
    return -1
  }

  for (let step = 1; step <= count; step++) {
    const index = (currentIndex - step + count) % count
    if (index === currentIndex) {
      break
    }
    if (isEligibleForTurn(players[index])) {
      return index
    }
  }

  return -1
}

export function countActivePlayers(players: Player[]): number {
  return players.filter(isEligibleForTurn).length
}

export function setActivePlayer(
  players: Player[],
  activeIndex: number,
): Player[] {
  return players.map((player, index) => {
    if (!isEligibleForTurn(player)) {
      return player
    }
    return { ...player, status: index === activeIndex ? 'active' : 'waiting' }
  })
}
