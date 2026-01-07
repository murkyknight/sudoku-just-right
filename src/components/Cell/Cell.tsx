import { useCallback, useRef, useState, type JSX, type MouseEvent } from 'react'
import { useLongPress, type LongPressCallback } from 'use-long-press'
import { useShallow } from 'zustand/shallow'
import useGameStore from '../store/useGameStore'
import { hasDigit } from '../utils/bitMaskHelper'
import Candidate from './Candidate'
import './Cell.css'
import NumberSelector from './NumberSelector'

const noComboKeyPressed = (event: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
  return !(event.ctrlKey || event.shiftKey || event.metaKey)
}

type CellProps = {
  index: number
  additionalClasses?: string
}

// TODO: move this somewhere?
export const CANDIDATES = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export default function Cell({ index, additionalClasses }: CellProps): JSX.Element {
  const cell = useGameStore((s) => s.board[index])
  const selectedCellIndex = useGameStore((s) => s.selectedCellIndex)
  const {
    placeValue,
    removeValue,
    addCandidate,
    removeCandidate,
    highlightCandidate,
    strikeCandidate,
    selectCell,
  } = useGameStore(
    useShallow((s) => ({
      placeValue: s.placeValue,
      removeValue: s.removeValue,
      addCandidate: s.addCandidate,
      removeCandidate: s.removeCandidate,
      highlightCandidate: s.highlightCandidate,
      strikeCandidate: s.strikeCandidate,
      selectCell: s.selectCell,
    })),
  )
  const [isNumberSelectorOpen, setIsNumberSelectorOpen] = useState(false)
  const cellRef = useRef<HTMLDivElement>(null)
  const wasLongPressRef = useRef(false)

  const openNumberSelector = useCallback(() => {
    setIsNumberSelectorOpen(true)
  }, [])
  const closeNumberSelector = useCallback(() => {
    setIsNumberSelectorOpen(false)
  }, [])

  const handleNumberSelectorMenuOpenNew: LongPressCallback<Element> = useCallback(
    (_event: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
      if (selectedCellIndex !== index) {
        selectCell(index)
      }

      openNumberSelector()
      wasLongPressRef.current = true
    },
    [index, selectedCellIndex, selectCell, openNumberSelector],
  )

  const longClickPointerHandlers = useLongPress(handleNumberSelectorMenuOpenNew, {
    filterEvents: (event) => {
      const LEFT_CLICK = 0
      const isLeftClick = 'button' in event && event.button === LEFT_CLICK
      return isLeftClick && noComboKeyPressed(event)
    },
    threshold: 150,
    cancelOutsideElement: true,
  })

  // TODO: think about making high lighting / striking togglable
  //    eg, if the user click the same cell with highlight combo, it should highlight then remove.
  //    why? Maybe they mistakely highlighted - right now they would need to remove candidate then add
  //         back with highlight.
  //        Striked is worse since we don't allow a candidate to be striked unless it it has been selected.
  //        So flow is - Click candidate, Strike, remove candidate, add candidate, strike candidate
  const handleUpdate = useCallback(
    (candidate: number) => {
      return (event: MouseEvent<HTMLButtonElement>) => {
        const isHighlightKeyCombo = event.ctrlKey
        const isStrikedKeyCombo = event.shiftKey && event.metaKey
        const isRemoveKeyCombo = event.metaKey

        if (wasLongPressRef.current) {
          // user cancelled number selector menu, don't mark candidate
          event.stopPropagation()
          event.preventDefault()
          wasLongPressRef.current = false
          return
        }

        if (isHighlightKeyCombo) {
          // could also double click?`
          event.preventDefault() // prevent opening right click menu
          highlightCandidate(index, candidate)
        } else if (isStrikedKeyCombo) {
          strikeCandidate(index, candidate)
        } else if (isRemoveKeyCombo) {
          removeCandidate(index, candidate)
        } else {
          addCandidate(index, candidate)
        }
      }
    },
    [addCandidate, index, removeCandidate, highlightCandidate, strikeCandidate],
  )

  const handleCellNumberSelection = useCallback(
    (num?: number) => {
      if (num) {
        placeValue(index, num)
      } else {
        removeValue(index)
      }
    },
    [index, placeValue, removeValue],
  )

  const handleBlur = () => {
    if (index === selectedCellIndex) {
      selectCell(null)
    }
  }

  const handleFocus = () => {
    if (index !== selectedCellIndex) {
      selectCell(index)
    }
  }
  
  const selectedStyle = index === selectedCellIndex ? 'selected ' : ''

  return (
    // biome-ignore lint/a11y/useSemanticElements: Can't use button element since we render nested buttons - can cause weird button behaviour.
    <div
      aria-label={`cell-${index}`}
      className={`cell ${selectedStyle} ${additionalClasses}`}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openNumberSelector()
        }
      }}
      ref={cellRef}
      role="button"
      tabIndex={0}
      {...longClickPointerHandlers()}
    >
      {isNumberSelectorOpen && (
        <NumberSelector
          onClose={closeNumberSelector}
          onSelect={handleCellNumberSelection}
          restoreFocusTo={cellRef.current}
        />
      )}
      {cell.value ? (
        <div className="cell-number">{cell.value}</div>
      ) : (
        CANDIDATES.map((candidate) => {
          const isActive = hasDigit(cell.candidates, candidate)
          const isHighlightActive = hasDigit(cell.highlightedCandidates, candidate)
          const isStrikedActive = hasDigit(cell.strikedCandidates, candidate)

          return (
            <Candidate
              candidate={candidate}
              isActive={isActive}
              isHighlighted={isHighlightActive}
              isStriked={isStrikedActive}
              key={candidate}
              onClick={handleUpdate(candidate)}
            />
          )
        })
      )}
    </div>
  )
}
