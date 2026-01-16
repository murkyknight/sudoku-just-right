import clsx from 'clsx'
import { useCallback, useRef, useState, type JSX, type MouseEvent } from 'react'
import { useLongPress, type LongPressCallback } from 'use-long-press'
import { useShallow } from 'zustand/shallow'
import useGameStore from '../store/useGameStore'
import { hasDigit } from '../utils/bitMaskHelper'
import Candidate from './Candidate'
import styles from './Cell.module.css'
import NumberSelector from './NumberSelector'

const noComboKeyPressed = (event: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
  return !(event.ctrlKey || event.shiftKey || event.metaKey)
}

type CellProps = {
  index: number
  additionalClasses?: string
}

const CANDIDATES = [1, 2, 3, 4, 5, 6, 7, 8, 9]

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

  const handleOpenNumberSelector: LongPressCallback<Element> = useCallback(
    (_event: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
      if (selectedCellIndex !== index) {
        selectCell(index)
      }

      if (!cell.given) {
        openNumberSelector()
        wasLongPressRef.current = true
      }
    },
    [index, selectedCellIndex, selectCell, openNumberSelector, cell.given],
  )

  const longClickPointerHandlers = useLongPress(handleOpenNumberSelector, {
    filterEvents: (event) => {
      const LEFT_CLICK = 0
      const isLeftClick = 'button' in event && event.button === LEFT_CLICK
      return isLeftClick && noComboKeyPressed(event)
    },
    threshold: 150,
    cancelOutsideElement: true,
  })

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

  const deselectCell = () => {
    if (index === selectedCellIndex) {
      selectCell(null)
    }
  }

  const handleFocus = () => {
    if (index !== selectedCellIndex) {
      selectCell(index)
    }
  }

  const isSelected = !cell.given && index === selectedCellIndex

  return (
    // biome-ignore lint/a11y/useSemanticElements: Can't use button element since we render nested buttons - can cause weird button behaviour.
    <div
      aria-label={`cell-${index}`}
      className={clsx(styles.cell, additionalClasses, {
        [styles.selected]: isSelected,
        [styles.given]: cell.given,
      })}
      onBlur={deselectCell}
      onFocus={handleFocus}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openNumberSelector()
        } else if (e.key === 'Escape') {
          deselectCell()
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
        <div className={styles.cellNumber}>{cell.value}</div>
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
