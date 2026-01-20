import type { Draft } from 'immer'
import { peers } from '../../utils/indices'
import type { State } from '../useGameStore'

// draftHeleprs.unmarkNonConflictsInDraft(state, index)
//             draftHeleprs.markConflictsInDraft(state, index, value)

export function updateConflictsInDraft(
  draft: Draft<State>,
  cellIndex: number,
  selectedValue: number,
) {
  clearResolvedPeerConflictsForCellInDraft(draft, cellIndex)
  markConflictsInDraft(draft, cellIndex, selectedValue)
}

// private
function markConflictsInDraft(draft: Draft<State>, cellIndex: number, selectedValue: number) {
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

/**
 * Re-evaluates conflicted peers for target cell. 
 * Only clears conflicts that are no longer valid relative to the target cell.
 * (i.e., it won’t blindly remove flags that come from other conflicting cells).
 * 
 * @param draft - Immer draft that we want to update
 * @param targetCellIndex - The cell we want to clear all resolved peer conflicts from
 */
export function clearResolvedPeerConflictsForCellInDraft(
  draft: Draft<State>,
  targetCellIndex: number,
) {
  // const startingCell = draft.board[targetCellIndex]
  // const targetValue = startingCell.value

  // TODO: solve this:
  // HACKY: need to include target index becuase it doesnt come with peers and we need to remove highlight if we choose valid number next
  // can we solve this better? - Maybe create a peersInclusive
  const targetPeers = [...peers[targetCellIndex], targetCellIndex]

  // once target value of cell is gone,
  // now I need to go and check all cells in peers that had conflics - are they still conflicted?

  // this will include the original target cell that we're removing - means we'll need to skip it below
  const currentlyConflictedCellsInPeers = targetPeers.filter(
    (peerIndex) => draft.board[peerIndex].hasConflict,
  )

  console.log('currentlyConflictedCellsInPeers: ', currentlyConflictedCellsInPeers)

  // check if they still have conflicts

  for (const conflictedCellIndex of currentlyConflictedCellsInPeers) {
    unmarkConflictsOfCellInDraft(draft, conflictedCellIndex, targetCellIndex)

    // we need to skip the conflictedCellIndex BUT we MUST set its cell to hasConflict = false IF we find no other cells
    // NOTE: If we do the update first THEN unmark conflicts, we don't need to to the above comment
  }
}

function unmarkConflictsOfCellInDraft(
  draft: Draft<State>,
  targetCellIndex: number,
  skipCellIndex: number,
) {
  console.log('targetCellIndex: ', targetCellIndex)
  const startingCell = draft.board[targetCellIndex]
  const targetValue = startingCell.value
  const targetPeers = peers[targetCellIndex] // peer list wont contain targetCellIndex

  const foundConflictCellIndexes = []

  // Search for conflicts
  for (const peerIndex of targetPeers) {
    // if we update new cell first then unmark we don't need `skipCellIndex` aka `peerIndex === skipCellIndex`
    if (peerIndex === skipCellIndex || peerIndex === targetCellIndex) {
      continue
    }

    const cell = draft.board[peerIndex]

    if (cell.value && cell.hasConflict && cell.value === targetValue) {
      foundConflictCellIndexes.push(peerIndex) // should be 0 length if no conflicts
    }
  }

  console.log('foundConflictCellIndexes: ', foundConflictCellIndexes.length)

  if (foundConflictCellIndexes.length === 0) {
    startingCell.hasConflict = false
  }
}

// loops over indices and looks for `value` -> returns index number if found
// skipIndex is here so we don't count the cell whos value we are looking for (as that cell would obviously have teh same number as itself lol)
// findValue(draft: Draft<State>, value: number, indices: number[], skipIndex: number): number
