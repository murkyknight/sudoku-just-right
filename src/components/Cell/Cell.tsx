import { useCallback, useState, type JSX, type MouseEvent } from 'react'
import { addBitToMask, hasDigit, removeItemFromMask } from '../utils/bitMaskHelper'
import Candidate from './Candidate'
import './Cell.css'
import NumberSelector from './NumberSelector'

// type CellProps = {
//     position: [] // maybe like [[1,1], [1,2]] (2D array value)? Update: Na, we'll use static indexcies
// }

type CellProps = {
  additionalClasses?: string
}

// TODO: move this somewhere?
export const CANDIDATES = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export default function Cell({ additionalClasses }: CellProps): JSX.Element {
  const [candidatesMask, setCandidatesMask] = useState(0)
  const [candidatesHighlightMask, setCandidatesHighlightMask] = useState(0)
  const [candidatesStrikedMask, setCandidatesStrikedMask] = useState(0)
  const [shouldShowNumberSelectorMenu, setShouldShowNumberSelectorMenu] = useState(false)
  const [cellNumber, setCellNumber] = useState<number | undefined>(undefined)

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
    const delay = 250

    // TODO: Another option could be to right click a cell to bring up the NumberSelector
    //  Why? Right clicking would be more snappy - no delay when clicking
    //       Also, if we find, through testing, that the menu is popping up when we don't want it to
    //       by sinmplely playing the game and clicking candidates, then we might have to change to this

    if (event.button === LEFT_CLICK) {
      timerId = setTimeout(() => {
        setShouldShowNumberSelectorMenu(true)
      }, delay)
    }
  }

  const handleSelectorMenuClose = () => {
    if (timerId) {
      clearTimeout(timerId)
    }
    setShouldShowNumberSelectorMenu(false)
  }

  const handleCellNumberSelection = useCallback((num?: number) => {
    console.log('Setting Cell number: ', num)
    setCellNumber(num)
  }, [])

  return (
    <button
      className={`cell ${additionalClasses}`}
      onBlur={handleSelectorMenuClose}
      onMouseDown={handleSelectorMenu}
      // onMouseOut={handleClose}
      onMouseUp={handleSelectorMenuClose}
      type="button"
    >
      {shouldShowNumberSelectorMenu && <NumberSelector onSelect={handleCellNumberSelection} />}
      {cellNumber
        ? cellNumber
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
