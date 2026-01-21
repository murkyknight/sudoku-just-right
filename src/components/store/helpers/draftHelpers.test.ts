import { produce } from 'immer'
import { getConflictingCellIndexes } from '../../testLib/boardTestHelpers'
import { createBoard, createStoreState } from '../../testLib/helpers'
import { cellBox, cellCol, cellRow } from '../../utils/indices'
import { clearResolvedPeerConflictsForCellInDraft, updateConflictsInDraft } from './draftHelpers'

describe('draftHelpers', () => {
  describe('updateConflictsInDraft()', () => {
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
          updateConflictsInDraft(draft, placedCellIndex, placedValue)
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
          updateConflictsInDraft(draft, placedCellIndex, placedValue)
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
          updateConflictsInDraft(draft, placedCellIndex, placedValue)
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
          updateConflictsInDraft(draft, placedCellIndex, placedValue)
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
          updateConflictsInDraft(draft, placedCellIndex, placedValue)
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
          updateConflictsInDraft(draft, placedIndex, placedValue)
        })

        expect(getConflictingCellIndexes(next.board)).toHaveLength(0)
        const nonConflictingPlacementValue = next.board[0].value
        expect(nonConflictingPlacementValue).toEqual(1) // unchanged
      })
    })

    describe('with existing conflicts on board', () => {
      it('clears conflicts introduced by the previously placed value when those conflicts no longer exist', () => {
        const placedIndex = 2
        const placedValue = 5
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [
              { cellIndex: placedIndex, cellPartial: { value: placedValue, hasConflict: true } },
              { cellIndex: 3, cellPartial: { hasConflict: true } },
            ],
          }),
        })
        expect(getConflictingCellIndexes(baseState.board)).toHaveLength(2)

        const updatedPlacedValue = 1
        const next = produce(baseState, (draft) => {
          updateConflictsInDraft(draft, placedIndex, updatedPlacedValue)
        })

        expect(getConflictingCellIndexes(next.board)).toHaveLength(0)
      })

      it('preserves existing conflicts when adding a non-conflicting placement', () => {
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

        const nextPlacedIndex = 1
        const nonConflictingPlacedValue = 1
        const next = produce(baseState, (draft) => {
          updateConflictsInDraft(draft, nextPlacedIndex, nonConflictingPlacedValue)
        })

        expect(getConflictingCellIndexes(next.board)).toEqual([placedIndex, conflictedIndex])
      })

      it('preserves continuously existing conflicts when an UNRELATED placement adds new conflicts', () => {
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

        const nextPlacedIndex = 1
        const nextPlacedValue = 6
        const next = produce(baseState, (draft) => {
          updateConflictsInDraft(draft, nextPlacedIndex, nextPlacedValue)
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
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [
              { cellIndex: placedIndex, cellPartial: { value: placedValue, hasConflict: true } },
              { cellIndex: conflictedIndex, cellPartial: { hasConflict: true } },
            ],
          }),
        })
        expect(getConflictingCellIndexes(baseState.board)).toHaveLength(2)

        const nextPlacedIndex = 10
        const next = produce(baseState, (draft) => {
          updateConflictsInDraft(draft, nextPlacedIndex, placedValue)
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
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [
              { cellIndex: boxPlacedIndex, cellPartial: { value: placedValue, hasConflict: true } },
              {
                cellIndex: columnPlacedIndex,
                cellPartial: { value: placedValue, hasConflict: true },
              },
              { cellIndex: conflictedGivenIndex, cellPartial: { hasConflict: true } },
            ],
          }),
        })
        expect(getConflictingCellIndexes(baseState.board)).toHaveLength(3)

        const nonConflictedValue = 1
        const next = produce(baseState, (draft) => {
          updateConflictsInDraft(draft, boxPlacedIndex, nonConflictedValue)
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
          updateConflictsInDraft(draft, placedIndex, placedValue)
        })

        expect(getConflictingCellIndexes(next.board)).toEqual([placedIndex, conflictedIndex])
      })
    })
  })

  describe('clearResolvedPeerConflictsForCellInDraft()', () => {
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
          clearResolvedPeerConflictsForCellInDraft(draft, placedCellIndex)
        })

        expect(getConflictingCellIndexes(next.board)).toHaveLength(0)
        const nonConflictingPlacementValue = next.board[0].value
        expect(nonConflictingPlacementValue).toEqual(1) // unchanged
      })
    })

    describe('with existing conflicts on board', () => {
      it('clears conflicts on the target cell and its same-row peer', () => {
        const targetCellIndex = 2
        const conflictedIndex = 3
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [
              { cellIndex: targetCellIndex, cellPartial: { value: 5, hasConflict: true } },
              { cellIndex: conflictedIndex, cellPartial: { hasConflict: true } },
            ],
          }),
        })
        expect(cellRow[targetCellIndex]).toEqual(cellRow[conflictedIndex])
        expect(getConflictingCellIndexes(baseState.board)).toHaveLength(2)

        const next = produce(baseState, (draft) => {
          clearResolvedPeerConflictsForCellInDraft(draft, targetCellIndex)
        })

        expect(getConflictingCellIndexes(next.board)).toHaveLength(0)
      })

      it('clears conflicts on the target cell and its same-column peer', () => {
        const targetCellIndex = 2
        const conflictedIndex = 47
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [
              { cellIndex: targetCellIndex, cellPartial: { value: 7, hasConflict: true } },
              { cellIndex: conflictedIndex, cellPartial: { hasConflict: true } },
            ],
          }),
        })
        expect(cellCol[targetCellIndex]).toEqual(cellCol[conflictedIndex])
        expect(getConflictingCellIndexes(baseState.board)).toHaveLength(2)

        const next = produce(baseState, (draft) => {
          clearResolvedPeerConflictsForCellInDraft(draft, targetCellIndex)
        })

        expect(getConflictingCellIndexes(next.board)).toHaveLength(0)
      })

      it('clears conflicts on the target cell and its same-box peer', () => {
        const targetCellIndex = 1
        const conflictedIndex = 11
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [
              { cellIndex: targetCellIndex, cellPartial: { value: 9, hasConflict: true } },
              { cellIndex: conflictedIndex, cellPartial: { hasConflict: true } },
            ],
          }),
        })
        expect(cellBox[targetCellIndex]).toEqual(cellBox[conflictedIndex])
        expect(getConflictingCellIndexes(baseState.board)).toHaveLength(2)

        const next = produce(baseState, (draft) => {
          clearResolvedPeerConflictsForCellInDraft(draft, targetCellIndex)
        })

        expect(getConflictingCellIndexes(next.board)).toHaveLength(0)
      })

      it('clears conflicts on the target cell and its same box/column/row peers', () => {
        const targetCellIndex = 1
        const conflictedBoxIndex = 9
        const conflictedRowIndex = 8
        const conflictedColIndex = 37
        const baseState = createStoreState({
          board: createBoard({
            placedCells: [
              { cellIndex: targetCellIndex, cellPartial: { value: 8, hasConflict: true } },
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
          clearResolvedPeerConflictsForCellInDraft(draft, targetCellIndex)
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
          clearResolvedPeerConflictsForCellInDraft(draft, targetCellIndex)
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
          clearResolvedPeerConflictsForCellInDraft(draft, targetCellIndex)
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
          clearResolvedPeerConflictsForCellInDraft(draft, targetCellIndex)
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
          clearResolvedPeerConflictsForCellInDraft(draft, targetCellIndex)
        })

        expect(getConflictingCellIndexes(next.board)).toHaveLength(0)
      })
    })
  })
})

