import { useCallback, useState, type JSX, type MouseEvent } from 'react'
import { addBitToMask, hasDigit, removeItemFromMask } from '../utils/bitMaskHelper'
import Candidate from './Candidate'
import './Cell.css'

// type CellProps = {
//     position: [] // maybe like [[1,1], [1,2]] (2D array value)? Update: Na, we'll use static indexcies
// }

type CellProps = {
  additionalClasses?: string
}

const CANDIDATES = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export default function Cell({ additionalClasses }: CellProps): JSX.Element {
  const [candidatesMask, setCandidatesMask] = useState(0)
  const [candidatesHighlightMask, setCandidatesHighlightMask] = useState(0)
  const [candidatesStrikedMask, setCandidatesStrikedMask] = useState(0)
  const [shouldShowNumberSelectorMenu, setShouldShowNumberSelectorMenu] = useState(false)

  const handleUpdate = useCallback(
    (candidate: number) => {
      return (event: MouseEvent<HTMLButtonElement>) => {
        const isHighlightKeyCombo = event.ctrlKey
        const isStrikedKeyCombo = event.shiftKey && event.metaKey
        const isRemoveKeyCombo = event.metaKey

        if (isHighlightKeyCombo) {
          // could also double click?`
          event.preventDefault() // prevent opening right click menu
          setCandidatesHighlightMask((prevHighlightMask) =>
            addBitToMask(candidate, prevHighlightMask),
          )
          setCandidatesMask((prevCandidatesMask) => addBitToMask(candidate, prevCandidatesMask))
        } else if (isStrikedKeyCombo && hasDigit(candidate, candidatesMask)) {
          setCandidatesStrikedMask((prevStrikedMask) => addBitToMask(candidate, prevStrikedMask))
          setCandidatesHighlightMask((prevHighlightMask) =>
            removeItemFromMask(candidate, prevHighlightMask),
          )
        } else if (isRemoveKeyCombo) {
          setCandidatesMask((prevCandidatesMask) =>
            removeItemFromMask(candidate, prevCandidatesMask),
          )
          setCandidatesHighlightMask((prevHighlightMask) =>
            removeItemFromMask(candidate, prevHighlightMask),
          )
          setCandidatesStrikedMask((prevStrikedMask) =>
            removeItemFromMask(candidate, prevStrikedMask),
          )
        } else {
          setCandidatesMask((prevCandidatesMask) => addBitToMask(candidate, prevCandidatesMask))
        }
      }
    },
    [candidatesMask],
  )

  let timerId: ReturnType<typeof setTimeout>

  const handleSelectorMenu = (event: MouseEvent) => {
    const LEFT_CLICK = 0
    const delay = 500

    if (event.button === LEFT_CLICK) {
      timerId = setTimeout(() => {
        setShouldShowNumberSelectorMenu(true)
      }, delay)
    }
  }

  const handleClose = () => {
    if (timerId) {
      clearTimeout(timerId)
    }
    setShouldShowNumberSelectorMenu(false)
  }

  return (
    <button
      className={`cell ${additionalClasses}`}
      onBlur={handleClose}
      onMouseDown={handleSelectorMenu}
      onMouseOut={handleClose}
      onMouseUp={handleClose}
      type="button"
    >
      {shouldShowNumberSelectorMenu
        ? 'Number Selector Menu'
        : CANDIDATES.map((candidate) => {
          const isActive = hasDigit(candidate, candidatesMask)
          const isHighlightActive = hasDigit(candidate, candidatesHighlightMask)
          const isStrikedActive = hasDigit(candidate, candidatesStrikedMask)

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
        })}
    </button>
  )
}
