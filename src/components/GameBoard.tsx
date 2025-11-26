import House from './House'
import './GameBoard.css'

export default function GameBoard() {
  return (
    <div className="container">
      <div className="game-board-container">
        <House additionalClasses="border-right-thick-1 border-bottom-thick-1" number={1} />
        <House additionalClasses="border-right-thick-1 border-bottom-thick-1" number={2} />
        <House additionalClasses="border-bottom-thick-1" number={3} />

        <House additionalClasses="border-right-thick-1 border-bottom-thick-1" number={4} />
        <House additionalClasses="border-right-thick-1 border-bottom-thick-1" number={5} />
        <House additionalClasses="border-bottom-thick-1" number={6} />

        <House additionalClasses="border-right-thick-1" number={7} />
        <House additionalClasses="border-right-thick-1" number={8} />
        <House additionalClasses="" number={9} />
      </div>
    </div>
  )
}
