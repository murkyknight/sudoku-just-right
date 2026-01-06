import { useEffect, useRef, type JSX } from 'react'
import { PiEraserDuotone } from 'react-icons/pi'
import { CANDIDATES } from './Cell'
import './NumberSelector.css'
import useClickOutside from './hooks/useClickOutside'

// TODO: - add storybook unit tests
//       - Maybe add right click on cell opens NumberSelector

// Design thoughts:
//  - Do we need an X close button?
//  - If so, then lets move the earser button to the top left and have an X icon top right
type NumberSelectorProps = {
  onSelect: (num?: number) => void
  onClose: () => void
}

// TODO: accept a ref prop that we focus back to after we close
export default function NumberSelector({ onSelect, onClose }: NumberSelectorProps): JSX.Element {
  const selectorRef = useRef<HTMLDivElement>(null)
  useClickOutside({ ref: selectorRef, onClickOutside: onClose })

  useEffect(() => {
    const handleClose = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleClose)

    return () => {
      document.removeEventListener('keydown', handleClose)
    }
  }, [onClose])

  return (
    <div
      aria-label="number selector menu"
      aria-modal="true"
      className="number-selector"
      ref={selectorRef}
      role="dialog"
    >
      {CANDIDATES.map((candidate: number) => {
        return (
          <button
            className="number-option"
            key={`selector-${candidate}`}
            onMouseUp={() => {
              onSelect(candidate)
            }}
            type="button"
          >
            {candidate}
          </button>
        )
      })}
      <button
        aria-label="cell number eraser"
        className="number-option eraser"
        key="selector-delete"
        onMouseUp={() => onSelect(undefined)}
        type="button"
      >
        <PiEraserDuotone />
      </button>
    </div>
  )
}
