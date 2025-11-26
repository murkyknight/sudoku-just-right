import './Cell.css'

// TODO: Add value prop for testing - we probs will use zod or some other state managment

// type CellProps = {
//     position: [] // maybe like [1,1] (2D array value)?
// }

type CellProps = {
  additionalClasses?: string
}

export default function Cell({ additionalClasses }: CellProps) {
  return (
    <div className={`cell ${additionalClasses}`}>
      <div className="cell-candidate-container">
        <div className="cell-candidate active">1</div>
        <div className="cell-candidate">2</div>
        <div className="cell-candidate">3</div>
      </div>
      <div className="cell-candidate-container">
        <div className="cell-candidate">4</div>
        <div className="cell-candidate">5</div>
        <div className="cell-candidate">6</div>
      </div>
      <div className="cell-candidate-container">
        <div className="cell-candidate">7</div>
        <div className="cell-candidate">8</div>
        <div className="cell-candidate">9</div>
      </div>
    </div>
  )
  // return (
  //     <div className="cell">
  //         {[1,2,3,4,5,6,7,8,9].map(num => {
  //             return (
  //                 <div key={num} className="cell-candidate">{num}</div>
  //             )
  //         })}
  //     </div>
  // )
}
