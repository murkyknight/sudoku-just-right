import { useCallback, useRef, useState, type JSX, type MouseEvent } from 'react'
import { useShallow } from 'zustand/shallow'
import useGameStore from '../store/useGameStore'
import { hasDigit } from '../utils/bitMaskHelper'
import Candidate from './Candidate'
import './Cell.css'
import NumberSelector from './NumberSelector'

// type CellProps = {
//     position: [] // maybe like [[1,1], [1,2]] (2D array value)? Update: Na, we'll use static indexcies
// }

const noComboKeyPressed = (event: MouseEvent) => {
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
  const {
    placeValue,
    removeValue,
    addCandidate,
    removeCandidate,
    highlightCandidate,
    removeCandidateHighlight,
    strikeCandidate,
  } = useGameStore(
    useShallow((s) => ({
      placeValue: s.placeValue,
      removeValue: s.removeValue,
      addCandidate: s.addCandidate,
      removeCandidate: s.removeCandidate,
      highlightCandidate: s.highlightCandidate,
      removeCandidateHighlight: s.removeCandidateHighlight,
      strikeCandidate: s.strikeCandidate,
    })),
  )

  const [isNumberSelectorOpen, setIsNumberSelectorOpen] = useState(false)
  const numberSelectorTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wasLongPressRef = useRef(false)

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

  const openNumberSelector = useCallback(() => {
    setIsNumberSelectorOpen(true)
  }, [])
  const closeNumberSelector = useCallback(() => {
    setIsNumberSelectorOpen(false)
  }, [])

  const handleNumberSelectorMenuOpen = (event: MouseEvent) => {
    event.preventDefault()
    const LEFT_CLICK = 0
    const delay = 150

    wasLongPressRef.current = false

    if (numberSelectorTimer.current) {
      clearTimeout(numberSelectorTimer.current)
    }

    if (event.button === LEFT_CLICK && noComboKeyPressed(event)) {
      numberSelectorTimer.current = setTimeout(() => {
        wasLongPressRef.current = true
        openNumberSelector()
      }, delay)
    }
  }

  const handleNumberSelectorMenuClose = useCallback(() => {
    if (numberSelectorTimer.current) {
      clearTimeout(numberSelectorTimer.current)
      numberSelectorTimer.current = null
    }
    closeNumberSelector()
  }, [closeNumberSelector])

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

  return (
    // biome-ignore lint/a11y/useSemanticElements: Can't use button element since we render nested buttons - can cause weird button behaviour.
    <div
      aria-label={`cell-${index}`}
      className={`cell ${additionalClasses}`}
      onBlur={handleNumberSelectorMenuClose}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openNumberSelector()
        }
      }}
      onMouseDown={handleNumberSelectorMenuOpen}
      onMouseUp={handleNumberSelectorMenuClose}
      role="button"
      tabIndex={0}
    >
      {isNumberSelectorOpen && (
        <NumberSelector
          onClose={handleNumberSelectorMenuClose}
          onSelect={handleCellNumberSelection}
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
