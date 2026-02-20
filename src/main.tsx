import { createRoot } from 'react-dom/client'
import GameBoard from './components/GameBoard/GameBoard.tsx'
import './styles/global.css'

// biome-ignore lint/style/noNonNullAssertion: creating root, relax.
createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <App />,
  // </StrictMode>,
)


function App() {
  return (
    <div className="grid place-content-center">
      <GameBoard />
    </div>
  )
}