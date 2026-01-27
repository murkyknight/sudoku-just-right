import clsx from 'clsx'
import styles from './Box.module.css'
import Cell from './Cell/Cell'
import { boxes } from './utils/indices'

type BoxProps = {
  index: number
  additionalClasses?: string
}

// Keep Box purely presentational and use static boxes[] so it never subscribes to changing store values.

export default function Box({ index, additionalClasses }: BoxProps) {
  const cells = boxes[index]

  return (
    <div className={clsx(styles.boxContainer, additionalClasses)}>
      {cells.map((cellIndex) => {
        return <Cell index={cellIndex} key={`box-${index}-cell-${cellIndex}`} />
      })}
    </div>
  )
}
