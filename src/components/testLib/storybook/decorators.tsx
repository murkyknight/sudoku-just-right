import type { Decorator } from '@storybook/react-vite'
import { useEffect } from 'react'
import cellStyles from '../../Cell/Cell.module.css'
import useGameStore, { type StoreState } from '../../store/useGameStore'
import { createStoreState, resetGameStore } from '../helpers'

export const withBasicGameStore: Decorator = (Story, { parameters }) => {
  const state: Partial<StoreState> = parameters.state ?? {}
  useEffect(() => {
    useGameStore.setState(createStoreState(state))
  }, [state])

  return <Story />
}

export const withFullBoardGameStore: Decorator = (Story, { parameters }) => {
  const state: Partial<StoreState> = parameters.state ?? {}

  useEffect(() => {
    resetGameStore({
      ...state,
    })
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

export const withCell: Decorator = (Story, _context) => {
  return (
    <div className={cellStyles.cell}>
      <Story />
    </div>
  )
}
