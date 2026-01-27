import { createRoot } from 'react-dom/client'
import GameBoard from './components/GameBoard.tsx'
import './styles/global.css'

// biome-ignore lint/style/noNonNullAssertion: creating root, relax.
createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <GameBoard />,
  // </StrictMode>,
)
