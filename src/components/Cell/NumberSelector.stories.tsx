import type { Meta, StoryObj } from '@storybook/react-vite'

import { within } from '@testing-library/react'
import NumberSelector from './NumberSelector'

const meta = {
  title: 'Board/Cell/NumberSelector',
  component: NumberSelector,
  args: {
  },
  decorators: [
    (Story) => (
      <div style={{position: 'relative'}}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof NumberSelector>

type Canvas = ReturnType<typeof within>

const getCandidateButton = (canvas: Canvas, candidate: number) =>
  canvas.getByRole('button', { name: `candidate-${candidate}` })

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    // const { candidate } = args

    // const candidateBtn = getCandidateButton(canvas, candidate)

    // expect(candidateBtn).toBeInTheDocument()
    // expect(candidateBtn).not.toHaveTextContent(candidate.toString())
  },
}

