import type { Draft } from 'immer'
import { peers, peersInclusive } from '../../utils/indices'
import type { State } from '../useGameStore'

export function updateConflictsInDraft(
  draft: Draft<State>,
  cellIndex: number,
  selectedValue: number,
) {
  clearResolvedPeerConflictsForCellInDraft(draft, cellIndex)
  markAllPeerConflictsForCellInDraft(draft, cellIndex, selectedValue)
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
export function clearResolvedPeerConflictsForCellInDraft(
  draft: Draft<State>,
  targetCellIndex: number,
) {
  const targetPeers = peersInclusive[targetCellIndex]

  const currentlyConflictedPeerCellIndexes = targetPeers.filter(
    (peerIndex) => draft.board[peerIndex].hasConflict,
  )

  for (const conflictedCellIndex of currentlyConflictedPeerCellIndexes) {
    clearConflictIfResolved(draft, conflictedCellIndex)
  }
}

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

// loops over indices and looks for `value` -> returns index number if found
// skipIndex is here so we don't count the cell whos value we are looking for (as that cell would obviously have teh same number as itself lol)
// findValue(draft: Draft<State>, value: number, indices: number[], skipIndex: number): number

// private
// why do we need selectedValue?? We can just get the selected value from cell.value
function markAllPeerConflictsForCellInDraft(
  draft: Draft<State>,
  cellIndex: number,
  selectedValue: number,
) {
  const cell = draft.board[cellIndex]
  const placedCellPeers = peers[cellIndex]

  for (const peerIndex of placedCellPeers) {
    const peer = draft.board[peerIndex]
    if (peer.value === selectedValue) {
      peer.hasConflict = true
      cell.hasConflict = true
    }
  }
}