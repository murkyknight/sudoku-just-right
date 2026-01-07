import Box from './Box'
import './GameBoard.css'

export const BOXS = [0, 1, 2, 3, 4, 5, 6, 7, 8]

// TODO: need to lift colours used in multiple CSS files into a custom var (like border colour)

export default function GameBoard() {
  return (
    <div className="container">
      <div className="game-board-container">
        {BOXS.map((boxIndex) => {
          return <Box index={boxIndex} key={`box-${boxIndex}`} />
        })}
      </div>
    </div>
  )
}
