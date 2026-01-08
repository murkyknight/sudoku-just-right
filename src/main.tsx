
import { createRoot } from 'react-dom/client'
import GameBoard from './components/GameBoard.tsx'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <GameBoard />,
  // </StrictMode>,
)
