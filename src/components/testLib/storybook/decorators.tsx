import type { Decorator } from '@storybook/react-vite'
import { useEffect } from 'react'
import useGameStore, { type StoreState } from '../../store/useGameStore'
import { createStoreState } from '../helpers'

export const withGameStore: Decorator = (Story, { parameters }) => {
  const state: Partial<StoreState> = parameters.state ?? {}
  useEffect(() => {
    useGameStore.setState(createStoreState(state))
  }, [state])

  return <Story />
}

export const withOutsideDiv: Decorator = (Story, _context) => {
  return (
    <div>
      <div data-testid="outside" />
      <Story />
    </div>
  )
}
