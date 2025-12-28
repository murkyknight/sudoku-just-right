import Cell from './Cell/Cell'
import './House.css'

type HouseProps = {
  number: number
  additionalClasses?: string
}

export const CELLS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export default function House({ number, additionalClasses }: HouseProps) {
  // TODO: House should not directly style the cells - what can we do?
  // Idea: capture this as state in Zustard so we can manipulate cell colours freely
  //         We'll also be able to do this in the cell and use the `cellId` to tell
  //         which cell it is when we look it up
  const cellBg1 = number % 2 === 0 ? 'light-bg' : 'dark-bg'
  const cellBg2 = number % 2 === 0 ? 'dark-bg' : 'light-bg'

  return (
    <div className={`house-container ${additionalClasses}`}>
      {CELLS.map((cell) => {
        return <Cell key={`house-${number}-cell-${cell}`} />
      })}
    </div>
  )
}
