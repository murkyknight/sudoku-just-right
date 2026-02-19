import { difficultyType } from '@/types'
import { getConflictingCellIndexes, isSameBoard } from '../testLib/boardTestHelpers'
import { generatePuzzleSources, resetGameStore } from '../testLib/helpers'
import { cellBox, cellCol, cellRow } from '../utils/indices'
import useGameStore, { type StoreState } from './useGameStore'

describe('useGameStore', () => {
  let store: () => StoreState

  beforeEach(() => {
    resetGameStore()
    store = () => useGameStore.getState()
  })

  afterAll(() => {
    resetGameStore()
  })

  function getValueAt(cellIndex: number): number | null {
    return store().board[cellIndex].value
  }

  describe('placeValue()', () => {
    it('sets cell value to placed value', () => {
      const placedCellIndex = 0
      const placedValue = 1

      store().placeValue(placedCellIndex, placedValue)

      expect(getValueAt(placedCellIndex)).toEqual(placedValue)
    })

    it('handles multiple updates on same cell', () => {
      const placedCellIndex = 0
      const finalPlacedValue = 3

      store().placeValue(placedCellIndex, 1)
      store().placeValue(placedCellIndex, 2)
      store().placeValue(placedCellIndex, finalPlacedValue)

      expect(getValueAt(placedCellIndex)).toEqual(finalPlacedValue)
    })

    describe('with no existing conflicts on board', () => {
      it('marks all affected cells when the placed value conflicts across multiple units (row/column/box)', () => {
        const placedCellIndex = 1
        const placedValue = 8

        store().placeValue(placedCellIndex, placedValue)

        const expectedConflictBoxCellIndex = 9
        const expectedConflictRowCellIndex = 8
        const expectedConflictColumnCellIndex = 37
        expect(store().board[placedCellIndex].value).toEqual(placedValue)
        expect(cellBox[placedCellIndex]).toEqual(cellBox[expectedConflictBoxCellIndex])
        expect(cellRow[placedCellIndex]).toEqual(cellRow[expectedConflictRowCellIndex])
        expect(cellCol[placedCellIndex]).toEqual(cellCol[expectedConflictColumnCellIndex])
        expect(getConflictingCellIndexes(store().board)).toEqual(
          expect.arrayContaining([
            placedCellIndex,
            expectedConflictRowCellIndex,
            expectedConflictBoxCellIndex,
            expectedConflictColumnCellIndex,
          ]),
        )
      })

      it('sets conflicts after cell transitions non-conflicted >> conflicted', () => {
        const placedCellIndex = 2
        const placedValue = 1
        store().placeValue(placedCellIndex, placedValue)
        expect(getValueAt(placedCellIndex)).toEqual(1)
        expect(getConflictingCellIndexes(store().board)).toHaveLength(0)

        const updatedPlacedValue = 5
        store().placeValue(placedCellIndex, updatedPlacedValue)

        const conflictedCellIndex = 3
        expect(store().board[placedCellIndex].value).toEqual(5)
        expect(getConflictingCellIndexes(store().board)).toEqual(
          expect.arrayContaining([placedCellIndex, conflictedCellIndex]),
        )
      })

      it('clears conflicts after cell transitions non-conflicted >> conflicted >> non-conflicted', () => {
        const placedCellIndex = 2
        const placedValue = 1
        // non-conflicted
        store().placeValue(placedCellIndex, placedValue)
        expect(getValueAt(placedCellIndex)).toEqual(1)
        expect(getConflictingCellIndexes(store().board)).toHaveLength(0)
        // conflicted
        const conflictedPlacedValue = 5
        store().placeValue(placedCellIndex, conflictedPlacedValue)
        expect(getConflictingCellIndexes(store().board)).toHaveLength(2)

        // non-conflicted
        store().placeValue(placedCellIndex, placedValue)

        expect(store().board[placedCellIndex].value).toEqual(1)
        expect(getConflictingCellIndexes(store().board)).toHaveLength(0)
      })
    })

    describe('with existing conflicts on board', () => {
      it('clears conflicts after cell transitions conflicted >> non-conflicted >> conflicted >> non-conflicted', () => {
        const placedCellIndex = 2
        // conflicted
        const conflictedPlacedValue = 5
        store().placeValue(placedCellIndex, conflictedPlacedValue)
        expect(getValueAt(placedCellIndex)).toEqual(5)
        expect(getConflictingCellIndexes(store().board)).toHaveLength(2)
        // non-conflicted
        const nonConflictedPlacedValue = 1
        store().placeValue(placedCellIndex, nonConflictedPlacedValue)
        expect(getConflictingCellIndexes(store().board)).toHaveLength(0)
        // conflicted
        store().placeValue(placedCellIndex, conflictedPlacedValue)
        expect(getConflictingCellIndexes(store().board)).toHaveLength(2)

        // non-conflicted
        store().placeValue(placedCellIndex, nonConflictedPlacedValue)

        expect(store().board[placedCellIndex].value).toEqual(1)
        expect(getConflictingCellIndexes(store().board)).toHaveLength(0)
      })

      it('handles multiple column only conflicts and updates', () => {
        const firstPlacedCellIndex = 4
        const secondPlacedCellIndex = 13
        const conflictingGivenIndex = 31
        const placedValue = 7
        store().placeValue(firstPlacedCellIndex, placedValue)
        store().placeValue(secondPlacedCellIndex, placedValue)
        expect(getConflictingCellIndexes(store().board)).toEqual(
          expect.arrayContaining([
            firstPlacedCellIndex,
            secondPlacedCellIndex,
            conflictingGivenIndex,
          ]),
        )

        const newNonConflictedPlacedValue = 1
        store().placeValue(firstPlacedCellIndex, newNonConflictedPlacedValue)

        const expectedSameColIndex = 4
        expect(cellCol[firstPlacedCellIndex]).toEqual(expectedSameColIndex)
        expect(cellCol[secondPlacedCellIndex]).toEqual(expectedSameColIndex)
        expect(cellCol[conflictingGivenIndex]).toEqual(expectedSameColIndex)
        expect(getConflictingCellIndexes(store().board)).toEqual(
          expect.arrayContaining([secondPlacedCellIndex, conflictingGivenIndex]),
        )
      })

      it('handles multiple row only conflicts and updates', () => {
        const firstPlacedCellIndex = 0
        const secondPlacedCellIndex = 1
        const conflictingGivenIndex = 3
        const placedValue = 5
        store().placeValue(firstPlacedCellIndex, placedValue)
        store().placeValue(secondPlacedCellIndex, placedValue)
        expect(getConflictingCellIndexes(store().board)).toEqual(
          expect.arrayContaining([
            firstPlacedCellIndex,
            secondPlacedCellIndex,
            conflictingGivenIndex,
          ]),
        )

        const newNonConflictedPlacedValue = 1
        store().placeValue(firstPlacedCellIndex, newNonConflictedPlacedValue)

        const expectedSameRowIndex = 0
        expect(cellRow[firstPlacedCellIndex]).toEqual(expectedSameRowIndex)
        expect(cellRow[secondPlacedCellIndex]).toEqual(expectedSameRowIndex)
        expect(cellRow[conflictingGivenIndex]).toEqual(expectedSameRowIndex)
        expect(getConflictingCellIndexes(store().board)).toEqual(
          expect.arrayContaining([secondPlacedCellIndex, conflictingGivenIndex]),
        )
      })

      it('handles multiple box only conflicts and updates', () => {
        const firstPlacedCellIndex = 0
        const secondPlacedCellIndex = 20
        const conflictingGivenIndex = 11
        const placedValue = 9
        store().placeValue(firstPlacedCellIndex, placedValue)
        store().placeValue(secondPlacedCellIndex, placedValue)
        expect(getConflictingCellIndexes(store().board)).toEqual(
          expect.arrayContaining([
            firstPlacedCellIndex,
            secondPlacedCellIndex,
            conflictingGivenIndex,
          ]),
        )

        const newNonConflictedPlacedValue = 7
        store().placeValue(firstPlacedCellIndex, newNonConflictedPlacedValue)

        const expectedSameRowIndex = 0
        expect(cellBox[firstPlacedCellIndex]).toEqual(expectedSameRowIndex)
        expect(cellBox[secondPlacedCellIndex]).toEqual(expectedSameRowIndex)
        expect(cellBox[conflictingGivenIndex]).toEqual(expectedSameRowIndex)
        expect(getConflictingCellIndexes(store().board)).toEqual(
          expect.arrayContaining([secondPlacedCellIndex, conflictingGivenIndex]),
        )
      })
    })
  })

  describe('setDifficulty', () => {
    describe('on same difficulty', () => {
      it('does nothing', () => {
        store().difficulty = difficultyType.EASY
        store().activeGame = generatePuzzleSources(1, 'easy')[0]

        store().setDifficulty(difficultyType.EASY)

        expect(store().difficulty).toEqual(difficultyType.EASY)
        expect(store().activeGame).not.toBeNull()
      })
    })

    describe('on new difficulty', () => {
      it('sets new difficulty', () => {
        store().difficulty = difficultyType.EASY

        store().setDifficulty(difficultyType.HARD)

        expect(store().difficulty).toEqual(difficultyType.HARD)
      })

      it('sets active game to null', () => {
        store().difficulty = difficultyType.EASY

        store().setDifficulty(difficultyType.HARD)

        expect(store().activeGame).toBeNull()
      })

      it('empties game cache', () => {
        store().difficulty = difficultyType.EASY

        store().setDifficulty(difficultyType.HARD)

        expect(store().puzzles).toEqual([])
      })

      it('sets gamePhase to loading', () => {
        store().difficulty = difficultyType.EASY

        store().setDifficulty(difficultyType.HARD)

        expect(store().gamePhase).toBe('loading')
      })
    })
  })

  describe('setPuzzles', () => {
    describe('when no active game', () => {
      it('starts a game when puzzles are added using first puzzle in cache', () => {
        const newCachePuzzleSources = generatePuzzleSources(3)
        store().activeGame = null
        store().puzzles = []

        store().setPuzzles(newCachePuzzleSources)

        const activeGamePuzzleSource = newCachePuzzleSources.shift() // first puzzle becomes active game
        expect(store().activeGame).toEqual(activeGamePuzzleSource)
        expect(store().puzzles).toEqual(newCachePuzzleSources)
        expect(store().gamePhase).toEqual('playing')
        expect(isSameBoard(store().board, store().activeGame?.board)).toBe(true)
      })
    })

    describe('when active game exists', () => {
      it('does not start a new game when puzzles are added to cache', () => {
        const currentActiveGame = generatePuzzleSources(1)[0]
        const cachePuzzleSources = generatePuzzleSources(3)
        const newPuzzleSources = generatePuzzleSources(3)
        store().activeGame = currentActiveGame
        store().puzzles = cachePuzzleSources

        store().setPuzzles(newPuzzleSources)

        expect(store().activeGame).toEqual(currentActiveGame)
        expect(isSameBoard(store().board, store().activeGame?.board)).toBe(true)
        expect(store().puzzles).toEqual([...cachePuzzleSources, ...newPuzzleSources])
      })
    })
  })
})
