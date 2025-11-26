import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

describe('App component', () => {
  it('renders the heading', () => {
    render(<App />)
    expect(screen.getByText('Vite + React')).toBeInTheDocument()
  })

  it('increments the count when button is clicked', () => {
    render(<App />)
    const button = screen.getByRole('button', { name: /count is 0/i })
    fireEvent.click(button)
    expect(button).toHaveTextContent(/count is 1/i)     
  })
})
