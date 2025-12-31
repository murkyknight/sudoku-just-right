import { useCallback, useRef, useState, type JSX, type MouseEvent } from 'react'
import { useShallow } from 'zustand/shallow'
import useGameStore from '../store/useGameStore'
import { addDigit, hasDigit, removeDigit } from '../utils/bitMaskHelper'
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
  const { placeValue, removeValue } = useGameStore(
    useShallow((s) => ({ placeValue: s.placeValue, removeValue: s.removeValue })),
  )

  const [candidatesMask, setCandidatesMask] = useState(0)
  const [candidatesHighlightMask, setCandidatesHighlightMask] = useState(0)
  const [candidatesStrikedMask, setCandidatesStrikedMask] = useState(0)
  const [isNumberSelectorOpen, setIsNumberSelectorOpen] = useState(false)
  const [cellNumber, setCellNumber] = useState<number | undefined>(undefined)
  const numberSelectorTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wasLongPressRef = useRef(false)

  const handleUpdate = useCallback(
    (candidate: number) => {
      return (event: MouseEvent<HTMLButtonElement>) => {
        const isHighlightKeyCombo = event.ctrlKey
        const isStrikedKeyCombo = event.shiftKey && event.metaKey
        const isRemoveKeyCombo = event.metaKey

        if (wasLongPressRef.current) {
          return
        } // user cancelled number selector menu, don't mark candidate

        if (isHighlightKeyCombo) {
          // could also double click?`
          event.preventDefault() // prevent opening right click menu
          setCandidatesHighlightMask((prevHighlightMask) => addDigit(prevHighlightMask, candidate))
          setCandidatesMask((prevCandidatesMask) => addDigit(prevCandidatesMask, candidate))
        } else if (isStrikedKeyCombo && hasDigit(candidatesMask, candidate)) {
          setCandidatesStrikedMask((prevStrikedMask) => addDigit(prevStrikedMask, candidate))
          setCandidatesHighlightMask((prevHighlightMask) =>
            removeDigit(prevHighlightMask, candidate),
          )
        } else if (isRemoveKeyCombo) {
          setCandidatesMask((prevCandidatesMask) => removeDigit(prevCandidatesMask, candidate))
          setCandidatesHighlightMask((prevHighlightMask) =>
            removeDigit(prevHighlightMask, candidate),
          )
          setCandidatesStrikedMask((prevStrikedMask) => removeDigit(prevStrikedMask, candidate))
        } else {
          setCandidatesMask((prevCandidatesMask) => addDigit(prevCandidatesMask, candidate))
        }
      }
    },
    [candidatesMask],
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
      setCellNumber(num)
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
          const isActive = hasDigit(candidatesMask, candidate)
          const isHighlightActive = hasDigit(candidatesHighlightMask, candidate)
          const isStrikedActive = hasDigit(candidatesStrikedMask, candidate)

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
