import './GameBoard.css'
import House from './House'

export const HOUSES = [0, 1, 2, 3, 4, 5, 6, 7, 8]

// TODO: need to lift colours used in multiple CSS files into a custom var (like border colour)

export default function GameBoard() {
  return (
    <div className="container">
      <div className="game-board-container">
        {HOUSES.map((houseIndex) => {
          return <House index={houseIndex} key={`house-${houseIndex}`} />
        })}
      </div>
    </div>
  )
}
