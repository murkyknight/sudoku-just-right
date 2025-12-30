import Cell from './Cell/Cell'
import './House.css'
import { houses } from './utils/indices'

type HouseProps = {
  index: number
  additionalClasses?: string
}

export const CELLS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

// Keep House purely presentational and use static boxes[] so it never subscribes to changing store values.

export default function House({ index, additionalClasses }: HouseProps) {
  const cells = houses[index]
  // TODO: House should not directly style the cells - what can we do?
  // Idea: capture this as state in Zustard so we can manipulate cell colours freely
  //         We'll also be able to do this in the cell and use the `cellId` to tell
  //         which cell it is when we look it up
  const cellBg1 = index % 2 === 0 ? 'light-bg' : 'dark-bg'
  const cellBg2 = index % 2 === 0 ? 'dark-bg' : 'light-bg'

  return (
    <div className={`house-container ${additionalClasses}`}>
      {cells.map((cellIndex) => {
        return <Cell index={cellIndex} key={`house-${index}-cell-${cellIndex}`} />
      })}
    </div>
  )
}
