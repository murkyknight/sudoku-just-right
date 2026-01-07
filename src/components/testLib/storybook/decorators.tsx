import type { Decorator } from '@storybook/react-vite'
import { useEffect } from 'react'
import useGameStore, { type StoreState } from '../../store/useGameStore'

export const withGameStore: Decorator = (Story, context) => {
  const state: Partial<StoreState> = context.parameters.state ?? {}

  useEffect(() => {
    useGameStore.setState({
      board: [
        {
          value: null,
          candidates: 0,
          highlightedCandidates: 0,
          strikedCandidates: 0,
        },
      ],
      selectedCellIndex: null,
      ...state,
    })
  }, [state])

  return (
    <Story />
  )
}

export const withOutsideDiv: Decorator = (Story, _context) => {
  return (
    <div>
      <div data-testid="outside" />
      <Story />
    </div>
  )
}
