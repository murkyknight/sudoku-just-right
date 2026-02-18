import { produce } from 'immer'
import { getConflictingCellIndexes } from '../../testLib/boardTestHelpers'
import { createBoard, createStoreState, generatePuzzleSources } from '../../testLib/helpers'
import { cellBox, cellCol, cellRow } from '../../utils/indices'
import {
  addPuzzlesToCache,
  clearResolvedPeerConflictsForCell,
  startNextPuzzle,
  updateConflictsForCell,
} from './draftHelpers'

/**
 * Mental Note:
 * The draft needs to be updated first before we can mark or resolve any conflicts on the target cell.
 * If the draft is not updated, how will we know what will be changed? We can't see the future, so we have
 * no choice but to wait until the draft is updated to reconclile conflicts.
 */

describe('draftHelpers', () => {
  describe('updateConflicts()', () => {
    describe('with no existing conflicts on board', () => {
      it('does not mark the cell as conflicting when the placed value has no conflicts', () => {
        const placedCellIndex = 2
        const placedValue = 1
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [{ cellIndex: placedCellIndex, cellPartial: { value: placedValue } }],
          }),
        })
        expect(getConflictingCellIndexes(baseState.board)).toHaveLength(0)

        const next = produce(baseState, (draft) => {
          updateConflictsForCell(draft, placedCellIndex)
        })

        expect(getConflictingCellIndexes(next.board)).toHaveLength(0)
        const nonConflictingPlacementValue = next.board[2].value
        expect(nonConflictingPlacementValue).toEqual(1) // unchanged
      })

      it('marks conflict when placed value duplicates another value in the same row', () => {
        const placedCellIndex = 2
        const placedValue = 5
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [{ cellIndex: placedCellIndex, cellPartial: { value: placedValue } }],
          }),
        })

        const next = produce(baseState, (draft) => {
          updateConflictsForCell(draft, placedCellIndex)
        })

        const expectedConflictRowCellIndex = 3
        expect(cellRow[placedCellIndex]).toEqual(cellRow[expectedConflictRowCellIndex])
        expect(getConflictingCellIndexes(next.board)).toEqual([
          placedCellIndex,
          expectedConflictRowCellIndex,
        ])
      })

      it('marks conflict when placed value duplicates another value in the same column', () => {
        const placedCellIndex = 2
        const placedValue = 7
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [{ cellIndex: placedCellIndex, cellPartial: { value: placedValue } }],
          }),
        })

        const next = produce(baseState, (draft) => {
          updateConflictsForCell(draft, placedCellIndex)
        })

        const expectedConflictColumnCellIndex = 47
        expect(cellCol[placedCellIndex]).toEqual(cellCol[expectedConflictColumnCellIndex])
        expect(getConflictingCellIndexes(next.board)).toEqual([
          placedCellIndex,
          expectedConflictColumnCellIndex,
        ])
      })

      it('marks conflict when placed value duplicates another value in the same box', () => {
        const placedCellIndex = 1
        const placedValue = 9
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [{ cellIndex: placedCellIndex, cellPartial: { value: placedValue } }],
          }),
        })

        const next = produce(baseState, (draft) => {
          updateConflictsForCell(draft, placedCellIndex)
        })

        const expectedConflictBoxCellIndex = 11
        expect(cellBox[placedCellIndex]).toEqual(cellBox[expectedConflictBoxCellIndex])
        expect(getConflictingCellIndexes(next.board)).toEqual([
          placedCellIndex,
          expectedConflictBoxCellIndex,
        ])
      })

      it('marks all affected cells when the placed value conflicts across multiple units (row/column/box)', () => {
        const placedCellIndex = 1
        const placedValue = 8
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [{ cellIndex: placedCellIndex, cellPartial: { value: placedValue } }],
          }),
        })

        const next = produce(baseState, (draft) => {
          updateConflictsForCell(draft, placedCellIndex)
        })

        const expectedConflictBoxCellIndex = 9
        const expectedConflictRowCellIndex = 8
        const expectedConflictColumnCellIndex = 37
        expect(cellBox[placedCellIndex]).toEqual(cellBox[expectedConflictBoxCellIndex])
        expect(cellRow[placedCellIndex]).toEqual(cellRow[expectedConflictRowCellIndex])
        expect(cellCol[placedCellIndex]).toEqual(cellCol[expectedConflictColumnCellIndex])
        expect(getConflictingCellIndexes(next.board)).toEqual([
          placedCellIndex,
          expectedConflictRowCellIndex,
          expectedConflictBoxCellIndex,
          expectedConflictColumnCellIndex,
        ])
      })

      it('is idempotent: re-placing the same non-conflicting value in the same cell does not change conflict flags', () => {
        const placedIndex = 0
        const placedValue = 1
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [{ cellIndex: placedIndex, cellPartial: { value: placedValue } }],
          }),
        })
        expect(getConflictingCellIndexes(baseState.board)).toHaveLength(0)

        // try place same value again
        const next = produce(baseState, (draft) => {
          updateConflictsForCell(draft, placedIndex)
        })

        expect(getConflictingCellIndexes(next.board)).toHaveLength(0)
        const nonConflictingPlacementValue = next.board[0].value
        expect(nonConflictingPlacementValue).toEqual(1) // unchanged
      })
    })

    describe('with existing conflicts on board', () => {
      it('clears conflicts introduced by the previously placed value when those conflicts no longer exist', () => {
        const placedIndex = 2
        const updatedPlacedValue = 1
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [
              {
                cellIndex: placedIndex,
                cellPartial: { value: updatedPlacedValue, hasConflict: true }, // was value 5
              },
              { cellIndex: 3, cellPartial: { hasConflict: true } },
            ],
          }),
        })
        expect(getConflictingCellIndexes(baseState.board)).toHaveLength(2)

        const next = produce(baseState, (draft) => {
          updateConflictsForCell(draft, placedIndex)
        })

        expect(getConflictingCellIndexes(next.board)).toHaveLength(0)
      })

      it('preserves existing conflicts when adding a non-conflicting placement', () => {
        const placedIndex = 2
        const placedValue = 5
        const conflictedIndex = 3
        const nextPlacedIndex = 1
        const nonConflictingPlacedValue = 1
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [
              { cellIndex: placedIndex, cellPartial: { value: placedValue, hasConflict: true } },
              { cellIndex: conflictedIndex, cellPartial: { hasConflict: true } },
              { cellIndex: nextPlacedIndex, cellPartial: { value: nonConflictingPlacedValue } },
            ],
          }),
        })
        expect(getConflictingCellIndexes(baseState.board)).toHaveLength(2)

        const next = produce(baseState, (draft) => {
          updateConflictsForCell(draft, nextPlacedIndex)
        })

        expect(getConflictingCellIndexes(next.board)).toEqual([placedIndex, conflictedIndex])
        expect(next.board[nextPlacedIndex].value).toEqual(1)
      })

      it('preserves continuously existing conflicts when an UNRELATED placement adds new conflicts', () => {
        const placedIndex = 2
        const placedValue = 5
        const conflictedIndex = 3
        const nextPlacedIndex = 1
        const nextPlacedValue = 6
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [
              { cellIndex: placedIndex, cellPartial: { value: placedValue, hasConflict: true } },
              { cellIndex: conflictedIndex, cellPartial: { hasConflict: true } },
              {
                cellIndex: nextPlacedIndex,
                cellPartial: { value: nextPlacedValue, hasConflict: false },
              },
            ],
          }),
        })
        expect(getConflictingCellIndexes(baseState.board)).toHaveLength(2)

        const next = produce(baseState, (draft) => {
          updateConflictsForCell(draft, nextPlacedIndex)
        })

        const newConflictedIndexes = [nextPlacedIndex, 6]
        expect(getConflictingCellIndexes(next.board)).toEqual(
          expect.arrayContaining([placedIndex, conflictedIndex, ...newConflictedIndexes]),
        )
      })

      it('preserves continuously existing conflicts when an RELATED placement adds new conflicts', () => {
        const placedIndex = 2
        const placedValue = 5
        const conflictedIndex = 3
        const nextPlacedIndex = 10
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [
              { cellIndex: placedIndex, cellPartial: { value: placedValue, hasConflict: true } }, // digit replaced: 5
              { cellIndex: conflictedIndex, cellPartial: { hasConflict: true } },
              {
                cellIndex: nextPlacedIndex,
                cellPartial: { value: placedValue, hasConflict: false },
              },
            ],
          }),
        })
        expect(getConflictingCellIndexes(baseState.board)).toHaveLength(2)

        const next = produce(baseState, (draft) => {
          updateConflictsForCell(draft, nextPlacedIndex)
        })

        expect(getConflictingCellIndexes(next.board)).toEqual(
          expect.arrayContaining([placedIndex, conflictedIndex, nextPlacedIndex]),
        )
      })

      it('updates conflicts: clears box conflict and preserves column conflict when box index value changes', () => {
        const boxPlacedIndex = 0
        const columnPlacedIndex = 56
        const placedValue = 9
        const conflictedGivenIndex = 11
        const nonConflictedValue = 1
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [
              {
                cellIndex: boxPlacedIndex,
                cellPartial: { value: nonConflictedValue, hasConflict: true }, // was value 9
              },
              {
                cellIndex: columnPlacedIndex,
                cellPartial: { value: placedValue, hasConflict: true },
              },
              { cellIndex: conflictedGivenIndex, cellPartial: { hasConflict: true } },
            ],
          }),
        })
        expect(getConflictingCellIndexes(baseState.board)).toHaveLength(3)

        const next = produce(baseState, (draft) => {
          updateConflictsForCell(draft, boxPlacedIndex)
        })

        expect(getConflictingCellIndexes(next.board)).toEqual(
          expect.arrayContaining([conflictedGivenIndex, columnPlacedIndex]),
        )
      })

      it('is idempotent: re-placing the same value in the same cell does not change conflict flags', () => {
        const placedIndex = 2
        const placedValue = 5
        const conflictedIndex = 3
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [
              { cellIndex: placedIndex, cellPartial: { value: placedValue, hasConflict: true } },
              { cellIndex: conflictedIndex, cellPartial: { hasConflict: true } },
            ],
          }),
        })
        expect(getConflictingCellIndexes(baseState.board)).toHaveLength(2)

        // try place same value again
        const next = produce(baseState, (draft) => {
          updateConflictsForCell(draft, placedIndex)
        })

        expect(getConflictingCellIndexes(next.board)).toEqual([placedIndex, conflictedIndex])
      })
    })
  })

  describe('clearResolvedPeerConflictsForCell()', () => {
    describe('with no existing conflicts on board', () => {
      it('does not do anything', () => {
        const placedCellIndex = 0
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [
              { cellIndex: 0, cellPartial: { value: 1 } }, // normal non-conflicting placement
            ],
          }),
        })
        expect(getConflictingCellIndexes(baseState.board)).toHaveLength(0)

        const next = produce(baseState, (draft) => {
          clearResolvedPeerConflictsForCell(draft, placedCellIndex)
        })

        expect(getConflictingCellIndexes(next.board)).toHaveLength(0)
        const nonConflictingPlacementValue = next.board[0].value
        expect(nonConflictingPlacementValue).toEqual(1) // unchanged
      })
    })

    describe('with existing conflicts on board', () => {
      it('clears conflicts for removed target cell value and its same-row peer', () => {
        const targetCellIndex = 2
        const conflictedIndex = 3
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [
              { cellIndex: targetCellIndex, cellPartial: { value: null, hasConflict: true } }, // digit removed: 5
              { cellIndex: conflictedIndex, cellPartial: { hasConflict: true } },
            ],
          }),
        })
        expect(cellRow[targetCellIndex]).toEqual(cellRow[conflictedIndex])
        expect(getConflictingCellIndexes(baseState.board)).toHaveLength(2)

        const next = produce(baseState, (draft) => {
          clearResolvedPeerConflictsForCell(draft, targetCellIndex)
        })

        expect(getConflictingCellIndexes(next.board)).toHaveLength(0)
      })

      it('clears conflicts for removed target cell value and its same-column peer', () => {
        const targetCellIndex = 2
        const conflictedIndex = 47
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [
              { cellIndex: targetCellIndex, cellPartial: { value: null, hasConflict: true } },
              { cellIndex: conflictedIndex, cellPartial: { hasConflict: true } },
            ],
          }),
        })
        expect(cellCol[targetCellIndex]).toEqual(cellCol[conflictedIndex])
        expect(getConflictingCellIndexes(baseState.board)).toHaveLength(2)

        const next = produce(baseState, (draft) => {
          clearResolvedPeerConflictsForCell(draft, targetCellIndex)
        })

        expect(getConflictingCellIndexes(next.board)).toHaveLength(0)
      })

      it('clears conflicts for removed target cell value and its same-box peer', () => {
        const targetCellIndex = 1
        const conflictedIndex = 11
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [
              { cellIndex: targetCellIndex, cellPartial: { value: null, hasConflict: true } }, // digit removed: 9
              { cellIndex: conflictedIndex, cellPartial: { hasConflict: true } },
            ],
          }),
        })
        expect(cellBox[targetCellIndex]).toEqual(cellBox[conflictedIndex])
        expect(getConflictingCellIndexes(baseState.board)).toHaveLength(2)

        const next = produce(baseState, (draft) => {
          clearResolvedPeerConflictsForCell(draft, targetCellIndex)
        })

        expect(getConflictingCellIndexes(next.board)).toHaveLength(0)
      })

      it('clears conflicts for removed target cell value and its same box/column/row peers', () => {
        const targetCellIndex = 1
        const conflictedBoxIndex = 9
        const conflictedRowIndex = 8
        const conflictedColIndex = 37
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [
              { cellIndex: targetCellIndex, cellPartial: { value: null, hasConflict: true } }, // digit removed: 8
              { cellIndex: conflictedBoxIndex, cellPartial: { hasConflict: true } },
              { cellIndex: conflictedRowIndex, cellPartial: { hasConflict: true } },
              { cellIndex: conflictedColIndex, cellPartial: { hasConflict: true } },
            ],
          }),
        })
        expect(cellBox[targetCellIndex]).toEqual(cellBox[conflictedBoxIndex])
        expect(cellRow[targetCellIndex]).toEqual(cellRow[conflictedRowIndex])
        expect(cellCol[targetCellIndex]).toEqual(cellCol[conflictedColIndex])
        expect(getConflictingCellIndexes(baseState.board)).toHaveLength(4)

        const next = produce(baseState, (draft) => {
          clearResolvedPeerConflictsForCell(draft, targetCellIndex)
        })

        expect(getConflictingCellIndexes(next.board)).toHaveLength(0)
      })

      it('updates peer conflicts for target cell - clears resolved, leaves others unchanged', () => {
        const targetCellIndex = 2
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [
              { cellIndex: 0, cellPartial: { value: 1 } }, // normal non-conflicting placement
              { cellIndex: 7, cellPartial: { value: 8, hasConflict: true } }, // other conflict
              { cellIndex: 8, cellPartial: { hasConflict: true } },
              { cellIndex: targetCellIndex, cellPartial: { value: 9, hasConflict: true } }, // primary conflict
              { cellIndex: 11, cellPartial: { hasConflict: true } },
            ],
          }),
        })

        expect(getConflictingCellIndexes(baseState.board)).toHaveLength(4)

        const next = produce(baseState, (draft) => {
          clearResolvedPeerConflictsForCell(draft, targetCellIndex)
        })

        const otherConflicts = [7, 8]
        expect(getConflictingCellIndexes(next.board)).toEqual(
          expect.arrayContaining(otherConflicts),
        )
        const nonConflictingPlacementValue = next.board[0].value
        expect(nonConflictingPlacementValue).toEqual(1) // unchanged
      })

      it('only removes conflicted target when multiple of same value exist in same unit, leaves the rest conflicted', () => {
        const targetCellIndex = 0
        const conflictedIndex1 = 1
        const conflictedIndex2 = 2
        const conflictedIndex3 = 11
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [
              { cellIndex: targetCellIndex, cellPartial: { value: 9, hasConflict: true } },
              { cellIndex: conflictedIndex1, cellPartial: { value: 9, hasConflict: true } },
              { cellIndex: conflictedIndex2, cellPartial: { value: 9, hasConflict: true } },
              { cellIndex: conflictedIndex3, cellPartial: { hasConflict: true } },
            ],
          }),
        })
        expect(getConflictingCellIndexes(baseState.board)).toHaveLength(4)

        const next = produce(baseState, (draft) => {
          clearResolvedPeerConflictsForCell(draft, targetCellIndex)
        })

        expect(getConflictingCellIndexes(next.board)).toEqual(
          expect.arrayContaining([conflictedIndex1, conflictedIndex2, conflictedIndex3]),
        )
      })

      it('will resolve conflicts even if target cell has no value but still has conflict flag', () => {
        const targetCellIndex = 2
        const conflictedIndex = 3
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [
              { cellIndex: targetCellIndex, cellPartial: { value: null, hasConflict: true } },
              { cellIndex: conflictedIndex, cellPartial: { hasConflict: true } },
            ],
          }),
        })
        expect(cellRow[targetCellIndex]).toEqual(cellRow[conflictedIndex])
        expect(getConflictingCellIndexes(baseState.board)).toHaveLength(2)

        const next = produce(baseState, (draft) => {
          clearResolvedPeerConflictsForCell(draft, targetCellIndex)
        })

        expect(getConflictingCellIndexes(next.board)).toHaveLength(0)
      })

      it('will resolve conflicts even if target has already removed value and conflict flag', () => {
        const targetCellIndex = 2
        const conflictedIndex = 3
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [
              { cellIndex: targetCellIndex, cellPartial: { value: null, hasConflict: false } }, // value was 5
              { cellIndex: conflictedIndex, cellPartial: { hasConflict: true } },
            ],
          }),
        })
        expect(cellRow[targetCellIndex]).toEqual(cellRow[conflictedIndex])
        expect(getConflictingCellIndexes(baseState.board)).toHaveLength(1)

        const next = produce(baseState, (draft) => {
          clearResolvedPeerConflictsForCell(draft, targetCellIndex)
        })

        expect(getConflictingCellIndexes(next.board)).toHaveLength(0)
      })
    })
  })

  describe('addPuzzlesToCache', () => {
    it('does nothing if new puzzle array is empty', () => {
      const puzzleSources = generatePuzzleSources(1)
      const baseState = createStoreState({
        puzzles: puzzleSources,
      })

      const next = produce(baseState, (draft) => {
        addPuzzlesToCache(draft, [])
      })

      expect(next.puzzles).toEqual(puzzleSources) // unchanged
    })

    describe('when puzzle cache is empty', () => {
      it('adds new puzzles to the cache', () => {
        const newPuzzles = generatePuzzleSources(2)
        const baseState = createStoreState({
          puzzles: [],
        })

        const next = produce(baseState, (draft) => {
          addPuzzlesToCache(draft, newPuzzles)
        })

        expect(next.puzzles).toEqual(newPuzzles)
      })
    })

    describe('when puzzles in cache exist', () => {
      it('adds new puzzles to the end of the cache', () => {
        const existingPuzzleCache = generatePuzzleSources(1)
        const newPuzzles = generatePuzzleSources(2)
        const baseState = createStoreState({
          puzzles: existingPuzzleCache,
        })

        const next = produce(baseState, (draft) => {
          addPuzzlesToCache(draft, newPuzzles)
        })

        expect(next.puzzles).toEqual([...existingPuzzleCache, ...newPuzzles])
      })
    })
  })

  describe('startNextPuzzle', () => {
    describe('when no puzzles in cache exist', () => {
      it('does nothing, since there is no game to start', () => {
        const baseState = createStoreState({
          puzzles: [],
          activeGame: null,
        })

        const next = produce(baseState, (draft) => {
          startNextPuzzle(draft)
        })

        expect(next.puzzles).toEqual([])
        expect(next.activeGame).toBeNull()
      })
    })

    describe('when puzzles in cache exist', () => {
      it('removes first puzzle from cache', () => {
        const cachedPuzzles = generatePuzzleSources(2)
        const baseState = createStoreState({
          puzzles: cachedPuzzles,
        })

        const next = produce(baseState, (draft) => {
          startNextPuzzle(draft)
        })

        const remainingCache = cachedPuzzles[1]
        expect(next.puzzles).toEqual([remainingCache])
      })

      it('sets first cached puzzle as active game', () => {
        const cachedPuzzles = generatePuzzleSources(2)
        const baseState = createStoreState({
          puzzles: cachedPuzzles,
          activeGame: null,
        })

        const next = produce(baseState, (draft) => {
          startNextPuzzle(draft)
        })

        const firstPuzzleInCache = cachedPuzzles[0]
        expect(next.activeGame).toEqual(firstPuzzleInCache)
      })

      it('sets game phase to "playing"', () => {
        const baseState = createStoreState({
          puzzles: generatePuzzleSources(2),
        })

        const next = produce(baseState, (draft) => {
          startNextPuzzle(draft)
        })

        expect(next.gamePhase).toEqual('playing')
      })
    })
  })
})
