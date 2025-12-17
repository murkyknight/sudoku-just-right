import { useCallback, useState, type JSX, type MouseEvent } from 'react'
import './Cell.css'
import Candidate from './Candidate'

// type CellProps = {
//     position: [] // maybe like [[1,1], [1,2]] (2D array value)? Update: Na, we'll use static indexcies
// }

type CellProps = {
  additionalClasses?: string
}

// TODO: move to own utility (also make more generic as we'll have more masks in the future)

const addBitToMask = (candidate: number, currentMask: number): number => {
  const mask = 1 << (candidate - 1)
  return currentMask | mask
}

const removeItemFromMask = (candidate: number, currentMask: number): number => {
  const mask = 1 << (candidate - 1)
  if (isCandidateActive(candidate, currentMask)) {
    return currentMask ^ mask
  }
  return currentMask
}

const isCandidateActive = (candidate: number, currentMask: number): boolean => {
  const mask = 1 << (candidate - 1)
  return (currentMask & mask) !== 0
}

const CANDIDATES = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export default function Cell({ additionalClasses }: CellProps): JSX.Element {
  const [candidatesMask, setCandidatesMask] = useState(0)
  const [candidatesHighlightMask, setCandidatesHighlightMask] = useState(0)
  const [candidatesStrikedMask, setCandidatesStrikedMask] = useState(0)

  const handleUpdate = useCallback((candidate: number) => {
    return (event: MouseEvent<HTMLButtonElement>) => {
      const isHighlightKeyCombo = event.ctrlKey
      const isStrikedKeyCombo = event.shiftKey && event.metaKey
      const isRemoveKeyCombo = event.metaKey

      if (isHighlightKeyCombo) {
        // could also double click?`
        event.preventDefault() // prevent opening right click menu
        setCandidatesHighlightMask((prevHighlightMask) => addBitToMask(candidate, prevHighlightMask))
        setCandidatesMask((prevCandidatesMask) => addBitToMask(candidate, prevCandidatesMask))

      } else if (isStrikedKeyCombo && isCandidateActive(candidate, candidatesMask)) {
        setCandidatesStrikedMask((prevStrikedMask) => addBitToMask(candidate, prevStrikedMask))
        setCandidatesHighlightMask((prevHighlightMask) => removeItemFromMask(candidate, prevHighlightMask))

      } else if (isRemoveKeyCombo) {
        setCandidatesMask((prevCandidatesMask) => removeItemFromMask(candidate, prevCandidatesMask))
        setCandidatesHighlightMask((prevHighlightMask) => removeItemFromMask(candidate, prevHighlightMask))
        setCandidatesStrikedMask((prevStrikedMask) => removeItemFromMask(candidate, prevStrikedMask))

      } else {
        setCandidatesMask((prevCandidatesMask) => addBitToMask(candidate, prevCandidatesMask))
      }
    }
  }, [candidatesMask])

  return (
    <div className={`cell ${additionalClasses}`}>
      {CANDIDATES.map((candidate) => {
        const isActive = isCandidateActive(candidate, candidatesMask)
        const isHighlightActive = isCandidateActive(candidate, candidatesHighlightMask)
        const isStrikedActive = isCandidateActive(candidate, candidatesStrikedMask)

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
    </div>
  )
}
