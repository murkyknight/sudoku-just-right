
import 'open-props/animations.min.css'
import 'open-props/colors.min.css'
import 'open-props/easings.min.css'
import 'open-props/shadows.min.css'
import { createRoot } from 'react-dom/client'
import GameBoard from './components/GameBoard.tsx'
import './styles/global.css'

// biome-ignore lint/style/noNonNullAssertion: creating root, relax.
createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <GameBoard />,
  // </StrictMode>,
)
