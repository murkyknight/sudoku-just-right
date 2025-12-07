import type { Meta, StoryObj } from '@storybook/react-vite'

// import { expect, userEvent, within } from 'storybook/test'
import Cell from './Cell'
import { within } from '@testing-library/react'
import { expect } from 'storybook/test'

const meta = {
  title: 'Board/Cell',
  component: Cell,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Cell>

type Canvas = unknown

const getCandidateButton = (canvas: Canvas, candidate: number) =>
  canvas.getByRole('button', { name: `candidate-${candidate}` })

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    for (let candidate = 1; candidate <= 9; candidate++) {
      const candidateBtn = getCandidateButton(canvas, candidate)
      await expect(candidateBtn).not.toHaveTextContent(candidate.toString())
    }
  },
}

export const DisplayAllCellCandidates: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)

    for (let candidate = 1; candidate <= 9; candidate++) {
      const candidateBtn = getCandidateButton(canvas, candidate)
      await userEvent.click(candidateBtn)
      await expect(candidateBtn).toHaveTextContent(candidate.toString())
    }
  },
}
