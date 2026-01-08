import clsx from 'clsx'
import { useEffect, useRef, type JSX } from 'react'
import { createPortal } from 'react-dom'
import { PiEraserDuotone } from 'react-icons/pi'
import styles from './NumberSelector.module.css'
import useClickOutside from './hooks/useClickOutside'

export const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

type NumberSelectorProps = {
  onSelect: (num?: number) => void
  onClose: () => void
  restoreFocusTo: HTMLElement | null
}

export default function NumberSelector({
  onSelect,
  onClose,
  restoreFocusTo,
}: NumberSelectorProps): JSX.Element {
  const selectorRef = useRef<HTMLDivElement>(null)
  useClickOutside({ ref: selectorRef, onClickOutside: onClose })

  useEffect(() => {
    const selectorEl = selectorRef.current
    if (!selectorEl) {
      return
    }

    requestAnimationFrame(() => {
      selectorEl.focus()
    })

    return () => {
      if (restoreFocusTo && document.contains(restoreFocusTo)) {
        restoreFocusTo.focus()
      }
    }
  }, [restoreFocusTo])

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

  const positionStyles = () => {
    const coords = restoreFocusTo?.getBoundingClientRect()
    const offset = 43
    if (coords) {
      return {
        left: coords.x - offset,
        top: coords.y - offset,
      }
    }
  }

  const handlePointerUp = (digit?: number) => () => {
    onSelect(digit)
    onClose()
  }

  const content = (
    <div
      aria-label="number selector menu"
      aria-modal="true"
      className={styles.numberSelector}
      ref={selectorRef}
      role="dialog"
      style={positionStyles()}
    >
      {DIGITS.map((digit: number) => {
        return (
          <button
            className={styles.numberOption}
            key={`selector-${digit}`}
            onPointerUp={handlePointerUp(digit)}
            type="button"
          >
            <span className={styles.numberText}>{digit}</span>
          </button>
        )
      })}
      <button
        aria-label="cell number eraser"
        className={clsx(styles.numberOption, styles.eraser)}
        key="selector-delete"
        onPointerUp={handlePointerUp(undefined)}
        type="button"
      >
        <PiEraserDuotone className={styles.numberText} />
      </button>
    </div>
  )

  return createPortal(content, document.body)
}
