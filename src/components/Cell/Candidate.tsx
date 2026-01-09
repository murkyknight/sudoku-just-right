import clsx from 'clsx'
import type { JSX, MouseEvent } from 'react'
import styles from './Cell.module.css'

type CandidateProps = {
  candidate: number
  isActive: boolean
  isHighlighted: boolean
  isStriked: boolean
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
}

export default function Candidate({
  candidate,
  isActive,
  isHighlighted,
  isStriked,
  onClick,
}: CandidateProps): JSX.Element {
  const isValidStriked = isActive && isStriked
  const muted = isValidStriked ? styles.muted : ''
  const highlight = isHighlighted ? styles.highlight : ''

  return (
    <button
      // TODO: key/label  need to be unique - we'll have 81 cells with 9 candidates
      // probs should be cellNumber.candiateNumber - since we'll number our cells 1 - 81
      aria-label={`candidate-${candidate}`}
      className={clsx(styles.candidate, highlight, muted)}
      key={candidate}
      onClick={onClick}
      onContextMenu={onClick}
      type="button"
    >
      <div>
        {isValidStriked && <StrikedLine />}
        {isActive && <>{candidate}</>}
      </div>
    </button>
  )
}

function StrikedLine(): JSX.Element {
  return (
    <div className={styles.striked}>
      <svg height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" width="70%">
        <title>striked</title>
        <line vectorEffect="non-scaling-stroke" x1="0" x2="100" y1="100" y2="0" />
      </svg>
    </div>
  )
}
