import { useCallback, useState, type MouseEvent } from 'react'
import './Cell.css'

// type CellProps = {
//     position: [] // maybe like [[1,1], [1,2]] (2D array value)? Update: Na, we'll use static indexcies
// }

type CellProps = {
  additionalClasses?: string
}

// TODO: move to own utility (also make more generic as we'll have more masks in the future)

const updateMask = (candidate: number, currentMask: number): number => {
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

export default function Cell({ additionalClasses }: CellProps) {
  const [candidatesMask, setCandidatesMask] = useState(0)
  const [candidatesHighlightMask, setCandidatesHighlightMask] = useState(0)
  // TODO: Do we need CellCandidate component to avoid dupe onClick logic?
  // Yes, will clena up return and also make it easier to test
  //  - number
  //  - isSelected
  //  - onClick - handles inital selection, highliting and striking

  const handleUpdate = useCallback((event: MouseEvent<HTMLButtonElement>, candidate: number) => {
    // TODO: DRY up
    if (event.ctrlKey) {
      // could also double click?`
      event.preventDefault() // prevents opening right click menu
      setCandidatesHighlightMask((prevMask) => updateMask(candidate, prevMask))
      setCandidatesMask((prevMask) => updateMask(candidate, prevMask))
    } else if (event.metaKey) {
      setCandidatesMask((prevMask) => removeItemFromMask(candidate, prevMask))
      setCandidatesHighlightMask((prevMask) => removeItemFromMask(candidate, prevMask))
    } else {
      setCandidatesMask((prevMask) => updateMask(candidate, prevMask))
    }
  }, [])

  // TODO: rmeove me
  console.log('%c[CELL RENDER]', 'color: blue;', 'mask:', candidatesMask.toString(2))
  console.log('%c[CELL RENDER]', 'color: green;', 'highlight mask:', candidatesHighlightMask.toString(2))

  return (
    <div className={`cell ${additionalClasses}`}>
      {CANDIDATES.map((candidate) => {
        const isActive = isCandidateActive(candidate, candidatesMask)
        const isHighlightActive = isCandidateActive(candidate, candidatesHighlightMask)

        const highlight = isHighlightActive ? 'highlight' : ''

        return (
          <button
            aria-label={`candidate-${candidate}`}
            className={`candidate ${highlight}`}
            key={candidate}
            onClick={(event: MouseEvent<HTMLButtonElement>) => handleUpdate(event, candidate)}
            onContextMenu={(event: MouseEvent<HTMLButtonElement>) => handleUpdate(event, candidate)}
            type="button"
          >
            {isActive && <div>{candidate}</div>}
          </button>
        )
      })}
    </div>
  )
}
