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
  unmarkNonConflictsInDraft(draft, cellIndex)
  markConflictsInDraft(draft, cellIndex, selectedValue)
}

// private
function markConflictsInDraft(
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


// TODO: we still have an issue with this senario:
// - Start with a valid cell value
// - Then update the same cell with a duplicate value - should flag validation
// - Now go back to valid value - cell is still showing validation error when it shouldnt 

// Another bug:
// Start with a column with 1 conflict
// then add another of the same conflict number - we should have 3 numbers min in conflic
// Change last number to a valid number
// expected, cell goes back to normal - actual - the cell is still hasConflict = true
// ========================================================
// WRITE TESTS BEFORE TOUCHING THIS CODE AGAIN!!!!!
// ========================================================
export function unmarkNonConflictsInDraft(draft: Draft<State>, targetCellIndex: number) {
  // const startingCell = draft.board[targetCellIndex]
  // const targetValue = startingCell.value

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
