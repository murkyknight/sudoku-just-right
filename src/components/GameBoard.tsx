import './GameBoard.css'
import House from './House'

export const HOUSES = [1, 2, 3, 4, 5, 6, 7, 8, 9]

// TODO: need to lift colours used in multiple CSS files into a custom var (like border colour)

export default function GameBoard() {
  return (
    <div className="container">
      <div className="game-board-container">
        {HOUSES.map((house) => {
          return <House key={`house-${house}`} number={house} />
        })}
      </div>
    </div>
  )
}
