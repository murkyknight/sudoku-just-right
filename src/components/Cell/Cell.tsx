import { useCallback, useState, type JSX, type MouseEvent } from 'react'
import './Cell.css'

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
  // TODO: Do we need CellCandidate component to avoid dupe onClick logic?
  // Yes, will clena up return and also make it easier to test
  //  - number
  //  - isSelected
  //  - onClick - handles inital selection, highliting and striking

  // TODO: create handleHighlight, handleStrike, handleSelection to DRY up handleUpdate

  // TODO: DRY up
  const handleUpdate = useCallback((candidate: number) => {
    return (event: MouseEvent<HTMLButtonElement>) => {
      if (event.ctrlKey) {
        // could also double click?`
        event.preventDefault() // prevents opening right click menu
        setCandidatesHighlightMask((prevMask) => addBitToMask(candidate, prevMask))
        setCandidatesMask((prevMask) => addBitToMask(candidate, prevMask))
      } else if (event.shiftKey && event.metaKey && isCandidateActive(candidate, candidatesMask)) {
        setCandidatesStrikedMask((prevStrikedMask) => addBitToMask(candidate, prevStrikedMask))
        setCandidatesHighlightMask((prevMask) => removeItemFromMask(candidate, prevMask))
      } else if (event.metaKey) {
        setCandidatesMask((prevMask) => removeItemFromMask(candidate, prevMask))
        setCandidatesHighlightMask((prevMask) => removeItemFromMask(candidate, prevMask))
        setCandidatesStrikedMask((prevStrikedMask) => removeItemFromMask(candidate, prevStrikedMask))
      } else {
        setCandidatesMask((prevMask) => addBitToMask(candidate, prevMask))
      }
    }
  }, [candidatesMask])

  // TODO: rmeove me
  console.log('%c[CELL RENDER]', 'color: blue;', 'mask:', candidatesMask.toString(2))
  console.log('%c[CELL RENDER]', 'color: green;', 'highlight mask:', candidatesHighlightMask.toString(2))
  console.log('%c[CELL RENDER]', 'color: green;', 'striked mask:', candidatesStrikedMask.toString(2))

  return (
    <div className={`cell ${additionalClasses}`}>
      {CANDIDATES.map((candidate) => {
        const isActive = isCandidateActive(candidate, candidatesMask)
        const isHighlightActive = isCandidateActive(candidate, candidatesHighlightMask)
        const isStrikedActive = isCandidateActive(candidate, candidatesStrikedMask)

        const highlight = isHighlightActive ? 'highlight ' : ''
        const muted = isStrikedActive ? 'muted ' : ''
        const styles = highlight.concat(muted)

        return (
          <button
            aria-label={`candidate-${candidate}`}
            className={`candidate ${styles}`}
            key={candidate}
            onClick={handleUpdate(candidate)}
            onContextMenu={handleUpdate(candidate)}
            type="button"
          >
            <div>
              {isStrikedActive && <StrikedLine />}
              {isActive && <div>{candidate}</div>}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function StrikedLine(): JSX.Element {
  return <div className="striked">
    <svg height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" width="70%">
      <title>striked</title>
      <line
        vector-effect="non-scaling-stroke"
        x1="0"
        x2="100"
        y1="100"
        y2="0" />
    </svg>
  </div>
}

