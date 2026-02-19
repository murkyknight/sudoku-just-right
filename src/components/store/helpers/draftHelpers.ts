import type { SudokuPuzzleSource } from '@/components/DifficultySelector/api'
import type { Draft } from 'immer'
import { peers, peersInclusive } from '../../utils/indices'
import type { State } from '../useGameStore'

/**
 * Updates all conflict flags within the passed cell's peer list, including the target cell itself.
 *
 * @param draft
 * @param cellIndex - target cell
 */
export function updateConflictsForCell(draft: Draft<State>, cellIndex: number) {
  clearResolvedPeerConflictsForCell(draft, cellIndex)
  markAllPeerConflictsForCell(draft, cellIndex)
}

/**
 * Re-evaluates conflicted peers for target cell.
 * Only clears conflicts that are no longer valid relative to the target cell, including the target cell.
 * (i.e., it won’t blindly remove flags that come from other conflicting cells).
 *
 * @param draft - Immer draft that we want to update
 * @param targetCellIndex - The cell we want to clear all resolved peer conflicts from,
 *  which may also include resolving a conflict on itself.
 */
export function clearResolvedPeerConflictsForCell(draft: Draft<State>, targetCellIndex: number) {
  const targetPeers = peersInclusive[targetCellIndex]

  const currentlyConflictedPeerCellIndexes = targetPeers.filter(
    (peerIndex) => draft.board[peerIndex].hasConflict,
  )

  for (const conflictedCellIndex of currentlyConflictedPeerCellIndexes) {
    clearConflictIfResolved(draft, conflictedCellIndex)
  }
}

export function addPuzzlesToCache(draft: Draft<State>, newPuzzles: SudokuPuzzleSource[]) {
  if (newPuzzles.length === 0) {
    return
  }

  draft.puzzles.push(...newPuzzles)
}

export function startNextPuzzle(draft: Draft<State>) {
  const nextPuzzle = draft.puzzles.shift()

  if (nextPuzzle) {
    draft.activeGame = nextPuzzle
    draft.board = createBoard(nextPuzzle.board)
    draft.gamePhase = 'playing'
  }
}

// Private functions

function clearConflictIfResolved(draft: Draft<State>, targetCellIndex: number) {
  const targetCell = draft.board[targetCellIndex]
  const targetValue = targetCell.value

  const targetCellHasNoValue = targetValue === null
  if (!hasConflicts(draft, targetCellIndex) || targetCellHasNoValue) {
    targetCell.hasConflict = false
  }
}

/**
 * Check to see if a given cell has conflicts
 *
 * @param draft
 * @param cellIndex Target cell
 * @returns true if at least one conflict is found within peers of given cellIndex
 */
function hasConflicts(draft: Draft<State>, cellIndex: number): boolean {
  const startingCell = draft.board[cellIndex]
  const peersOfStartingCell = peers[cellIndex]

  let hasConflict = false
  for (const peerIndex of peersOfStartingCell) {
    const peerCell = draft.board[peerIndex]
    if (peerCell.value === startingCell.value) {
      hasConflict = true
    }
  }

  return hasConflict
}

function markAllPeerConflictsForCell(draft: Draft<State>, cellIndex: number) {
  const cell = draft.board[cellIndex]
  const cellPeers = peers[cellIndex]
  const nonNullSelectedValue = !!cell.value && cell.value

  for (const peerIndex of cellPeers) {
    const peerCell = draft.board[peerIndex]
    if (peerCell.value === nonNullSelectedValue) {
      peerCell.hasConflict = true
      cell.hasConflict = true
    }
  }
}

function createBoard(rawBoard: string) {
  return Array.from({ length: 81 }, (_, i) => ({
    value: Number(rawBoard[i]) || null,
    candidates: 0,
    highlightedCandidates: 0,
    strikedCandidates: 0,
    given: !!Number(rawBoard[i]),
    hasConflict: false,
  }))
}