import type { Decorator } from '@storybook/react-vite'
import { useEffect } from 'react'
import cellStyles from '../../Cell/Cell.module.css'
import useGameStore, { type StoreState } from '../../store/useGameStore'
import { createBoard, createStoreState } from '../helpers'

export const withGameStore: Decorator = (Story, { parameters }) => {
  const state: Partial<StoreState> = parameters.state ?? {}
  useEffect(() => {
    useGameStore.setState(createStoreState(state))
  }, [state])

  return <Story />
}

export const withFullBoardGameStore: Decorator = (Story, { parameters }) => {
  const state: Partial<StoreState> = parameters.state ?? {}
  useEffect(() => {
    useGameStore.setState(
      createStoreState({
        board: createBoard(),
        ...state,
      }),
    )
  }, [state])

  return <Story />
}

// TODO: new function withFullBoardGameStore

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
