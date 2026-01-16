import type { Meta, StoryObj } from '@storybook/react-vite'

import { within } from '@testing-library/react'
import { expect, fn } from 'storybook/test'
import { cssSelectorToRegEx } from '../testLib/helpers'
import { withCell } from '../testLib/storybook/decorators'
import Candidate from './Candidate'

const meta = {
  title: 'Board/Cell/Candidate',
  component: Candidate,
  args: {
    candidate: 1,
    isActive: false,
    isHighlighted: false,
    isStriked: false,
    onClick: fn(),
  },
  decorators: [withCell],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Candidate>

type Canvas = ReturnType<typeof within>

const getCandidateButton = (canvas: Canvas, candidate: number) =>
  canvas.getByRole('button', { name: `candidate-${candidate}` })

export default meta
type Story = StoryObj<typeof meta>

export const NotActive: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const { candidate } = args

    const candidateBtn = getCandidateButton(canvas, candidate)

    expect(candidateBtn).toBeInTheDocument()
    expect(candidateBtn).not.toHaveTextContent(candidate.toString())
  },
}

export const Active: Story = {
  args: {
    isActive: true,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const { candidate } = args

    const candidateBtn = getCandidateButton(canvas, candidate)

    await expect(candidateBtn).toHaveTextContent(candidate.toString())
  },
}

export const Highlighted: Story = {
  args: {
    isActive: true,
    isHighlighted: true,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const { candidate } = args

    const candidateBtn = getCandidateButton(canvas, candidate)

    await expect(candidateBtn).toHaveTextContent(candidate.toString())
    await expect(candidateBtn).toHaveClass(cssSelectorToRegEx('highlight'))
  },
}

export const Striked: Story = {
  args: {
    isActive: true,
    isHighlighted: false,
    isStriked: true
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const { candidate } = args

    const candidateBtn = getCandidateButton(canvas, candidate)
    expect(candidateBtn).toHaveTextContent(candidate.toString())

    const strikedSvg = within(candidateBtn).getByTitle('striked')
    expect(strikedSvg).toBeInTheDocument()
    expect(candidateBtn).toHaveClass(cssSelectorToRegEx('muted'))
  },
}

export const CanNotStrikeNonActiveCandidate: Story = {
  args: {
    isActive: false,
    isHighlighted: false,
    isStriked: true
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const { candidate } = args

    const candidateBtn = getCandidateButton(canvas, candidate)
    expect(candidateBtn).not.toHaveTextContent(candidate.toString())

    const strikedSvg = within(candidateBtn).queryByTitle('striked')
    expect(strikedSvg).not.toBeInTheDocument()
    expect(candidateBtn).not.toHaveClass(cssSelectorToRegEx('muted'))
  },
}

