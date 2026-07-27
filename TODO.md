# Sprint: Turn Ownership & Bet Synchronization

## Information Gathered

### Current Architecture:
- **MultiplayerGameController**: Handles multiplayer game logic, validates turns via `isCurrentTurn()`, processes actions via host-only execution
- **MultiplayerGameProvider**: Wraps game with multiplayer context, provides `multiplayerMetadata` with `isCurrentPlayerTurn`
- **Game.tsx**: Main game page - currently uses `isHost`-based control logic (WRONG)
- **playerActionEngine.ts**: Pure reducer for all game actions including `handleBet`
- **multiplayerSync.ts**: Action request/processing pipeline using Firestore subcollection

### Current Issues:
1. **Game.tsx** uses `controlsDisabled = isMultiplayer ? (!isHost || syncing) : false` - should check `isCurrentPlayerTurn` not `isHost`
2. **FAB button** shows "Waiting for..." but only checks `isHost`, not `isCurrentPlayerTurn`
3. **Action sheet** items disabled based on wrong `controlsDisabled` logic
4. **MultiplayerGameController.isCurrentTurn()** has redundant check (`player.id === this.currentPlayerId` after already finding active player)
5. **No server-side turn validation** in `processActionRequest` - only validates `action.playerId` matches active player, but doesn't verify the requesting player is the authenticated one

## Plan

### 1. Fix `MultiplayerGameController.ts`
- [x] Fix `isCurrentTurn()` method - remove redundant check
- [x] Add `isCurrentPlayerTurn` getter that compares `currentPlayerId` with `playerId`
- [x] Add proper turn validation in `dispatchAction()` - verify `action.playerId === this.playerId` (authenticated user check)

### 2. Fix `Game.tsx` - Turn Ownership UI
- [x] Replace `isHost`-based control logic with `isCurrentPlayerTurn`-based logic
- [x] Get `isCurrentPlayerTurn` from multiplayer metadata
- [x] Disable entire Action Bar when not player's turn
- [x] Show "Waiting for <Current Player Name>..." when not player's turn
- [x] Enable only Bet/Call/Raise/Pack/See/Side Show buttons when it IS player's turn
- [x] Highlight active player's seat (already done via `isCurrentTurn` prop)

### 3. Fix `MultiplayerGameProvider.tsx`
- [x] Pass `isCurrentPlayerTurn` through context properly (already done via `multiplayerMetadata`)

### 4. Bet Synchronization - Verify Flow
- [x] Verify `dispatchAction` → `publishPlayerActionRequest` → host processes → `engine.executeAction` → Firestore update → all clients update
- [x] Ensure `handleBet` in `playerActionEngine.ts` properly advances turn
- [x] Ensure `processActionRequest` validates turn before executing

## Dependent Files to be Edited:
1. `src/controllers/MultiplayerGameController.ts`
2. `src/pages/Game.tsx`
3. `src/context/MultiplayerGameProvider.tsx`

## Followup Steps:
- [ ] Test with two browsers
- [ ] Verify no desync
- [ ] Verify no duplicate actions
- [ ] Verify no React errors
- [ ] Verify Firestore remains authoritative
