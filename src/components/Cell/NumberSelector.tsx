import type { JSX } from 'react'
import { PiEraserDuotone } from 'react-icons/pi'
import { CANDIDATES } from './Cell'
import './NumberSelector.css'

/**
 * We should use a grid to position the numbers how we want them
 *  - circle like, around the cell (maybe other deigns).
 *  - They will be all buttons
 *  - Well need to position it absolutly relative to the cell AND make it sit above cell with z-index
 *  - NumberSelector accepts a prop that can update the cell number in the Cell
 *  - 10 buttons in total - 1- 9 & must include a delete/remove button
 */
export default function NumberSelector(): JSX.Element {
  return (
    <div className="number-selector">
      {CANDIDATES.map((candidate: number) => {
        return (
          <button className="number-option" key={`selector-${candidate}`} type="button">
            {candidate}
          </button>
        )
      })}
      <button
        aria-label="cell-number-eraser"
        className="number-option eraser"
        key="selector-delete"
        type="button"
      >
        <PiEraserDuotone />
      </button>
    </div>
  )
}
