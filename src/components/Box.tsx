import './Box.css'
import Cell from './Cell/Cell'
import { boxes } from './utils/indices'

type BoxProps = {
  index: number
  additionalClasses?: string
}

// Keep Box purely presentational and use static boxes[] so it never subscribes to changing store values.

export default function Box({ index, additionalClasses }: BoxProps) {
  const cells = boxes[index]
  // TODO: Box should not directly style the cells - what can we do?
  // Idea: capture this as state in Zustard so we can manipulate cell colours freely
  //         We'll also be able to do this in the cell and use the `cellId` to tell
  //         which cell it is when we look it up
  const cellBg1 = index % 2 === 0 ? 'light-bg' : 'dark-bg'
  const cellBg2 = index % 2 === 0 ? 'dark-bg' : 'light-bg'

  return (
    <div className={`box-container ${additionalClasses}`}>
      {cells.map((cellIndex) => {
        return <Cell index={cellIndex} key={`box-${index}-cell-${cellIndex}`} />
      })}
    </div>
  )
}
