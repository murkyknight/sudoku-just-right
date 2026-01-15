import type { Meta, StoryObj } from '@storybook/react-vite'
import { fireEvent, within } from '@testing-library/react'
import { expect, screen, waitFor } from 'storybook/test'
import { createCell, cssSelectorToRegEx, setMaskDigits, storeWithCell } from '../testLib/helpers'
import { withGameStore, withOutsideDiv } from '../testLib/storybook/decorators'
import { addDigit } from '../utils/bitMaskHelper'
import Cell from './Cell'

const meta = {
  title: 'Board/Cell',
  component: Cell,
  args: {
    index: 0,
  },
  decorators: [withGameStore, withOutsideDiv],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Cell>

type Canvas = ReturnType<typeof within>

// TODO: add some common actions
// eg LongPress(digit: number), clickCandidate(digit: number)

const EMPTY_MASK = 0

const getCandidateButton = (canvas: Canvas, candidate: number) =>
  canvas.getByRole('button', { name: `candidate-${candidate}` })

const getNumberSelector = () => screen.getByRole('dialog', { name: 'number selector menu' })

const getCellButton = (canvas: Canvas, index: number) =>
  canvas.getByRole('button', { name: `cell-${index}` })

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    for (let candidate = 1; candidate <= 9; candidate++) {
      const candidateBtn = getCandidateButton(canvas, candidate)
      await expect(candidateBtn).not.toHaveTextContent(candidate.toString())
    }

    const cell = getCellButton(canvas, args.index)
    await expect(cell).not.toHaveClass(cssSelectorToRegEx('selected'))
  },
}

export const ClickingCandidateSelectsCell: Story = {
  play: async ({ canvasElement, userEvent, args }) => {
    const canvas = within(canvasElement)
    const candidate = 5
    const candidateBtn = getCandidateButton(canvas, candidate)
    await userEvent.click(candidateBtn)

    const cell = getCellButton(canvas, args.index)
    await expect(cell).toHaveClass(cssSelectorToRegEx('selected'))
  },
}

export const ClickingCellNumberSelectsCell: Story = {
  parameters: {
    state: storeWithCell({ value: 1 }),
  },
  play: async ({ canvasElement, userEvent, args }) => {
    const canvas = within(canvasElement)
    const cell = getCellButton(canvas, args.index)

    await userEvent.click(cell)

    await expect(cell).toHaveClass(cssSelectorToRegEx('selected'))
  },
}

export const ClickingCellWithGivenNumberDoesNotVisuallySelectCell: Story = {
  parameters: {
    state: storeWithCell({ value: 1, given: true }),
  },
  play: async ({ canvasElement, userEvent, args }) => {
    const canvas = within(canvasElement)
    const cell = getCellButton(canvas, args.index)

    await userEvent.click(cell)

    await expect(cell).not.toHaveClass(cssSelectorToRegEx('selected'))
  },
}

export const EscapeDeselectsCell: Story = {
  parameters: {
    state: {
      board: [
        createCell({
          candidates: addDigit(EMPTY_MASK, 5),
        }),
      ],
      selectedCellIndex: 0,
    },
  },
  play: async ({ canvasElement, userEvent, args }) => {
    const canvas = within(canvasElement)
    const candidate = 5
    getCandidateButton(canvas, candidate)
    const cell: HTMLElement = getCellButton(canvas, args.index)
    cell.focus()
    await expect(cell).toHaveClass(cssSelectorToRegEx('selected'))

    await userEvent.keyboard('{Escape}')

    await expect(cell).not.toHaveClass(cssSelectorToRegEx('selected'))
  },
}

export const ClickingOutsideCellDeselectsIt: Story = {
  parameters: {
    state: {
      board: [
        createCell({
          candidates: addDigit(EMPTY_MASK, 5),
        }),
      ],
      selectedCellIndex: 0,
    },
  },
  play: async ({ canvasElement, userEvent, args }) => {
    const canvas = within(canvasElement)
    const candidate = 5
    getCandidateButton(canvas, candidate)
    const cell: HTMLElement = getCellButton(canvas, args.index)
    cell.focus()
    await expect(cell).toHaveClass(cssSelectorToRegEx('selected'))

    const outsideComp = canvas.getByTestId('outside')
    await userEvent.click(outsideComp)

    await expect(cell).not.toHaveClass(cssSelectorToRegEx('selected'))
  },
}

export const CanAddCellCandidates: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)

    for (let candidate = 1; candidate <= 9; candidate++) {
      const candidateBtn = getCandidateButton(canvas, candidate)
      await userEvent.click(candidateBtn)
      await expect(candidateBtn).toHaveTextContent(candidate.toString())
    }
  },
}

export const CanHighlightCellCandidates: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)

    await userEvent.keyboard('{Control>}')
    for (let candidate = 1; candidate <= 9; candidate++) {
      const candidateBtn = getCandidateButton(canvas, candidate)
      await userEvent.click(candidateBtn)
      await expect(candidateBtn).toHaveTextContent(candidate.toString())
      await expect(candidateBtn).toHaveClass(cssSelectorToRegEx('highlight'))
    }
    await userEvent.keyboard('{/Control}')
  },
}

export const CanRemoveCellCandidates: Story = {
  parameters: {
    state: {
      board: [
        createCell({
          candidates: setMaskDigits(),
        }),
      ],
    },
  },
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)

    for (let candidate = 1; candidate <= 9; candidate++) {
      const candidateBtn = getCandidateButton(canvas, candidate)
      await expect(candidateBtn).toHaveTextContent(candidate.toString())
    }

    await userEvent.keyboard('{Meta>}')
    for (let candidate = 1; candidate <= 9; candidate++) {
      const candidateBtn = getCandidateButton(canvas, candidate)
      await userEvent.click(candidateBtn)
      await expect(candidateBtn).not.toHaveTextContent(candidate.toString())
    }
    await userEvent.keyboard('{/Meta}')
  },
}

export const CanStrikeCellCandidates: Story = {
  parameters: {
    state: {
      board: [
        createCell({
          candidates: setMaskDigits(),
        }),
      ],
    },
  },
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)

    for (let candidate = 1; candidate <= 9; candidate++) {
      const candidateBtn = getCandidateButton(canvas, candidate)
      await expect(candidateBtn).toHaveTextContent(candidate.toString())
    }

    await userEvent.keyboard('{Meta>}{Shift>}')
    for (let candidate = 1; candidate <= 9; candidate++) {
      const candidateBtn = getCandidateButton(canvas, candidate)
      await userEvent.click(candidateBtn)

      await expect(candidateBtn).toHaveTextContent(candidate.toString())
      const strikedSvg = within(candidateBtn).getByTitle('striked')
      await expect(strikedSvg).toBeInTheDocument()
      await expect(candidateBtn).toHaveClass(cssSelectorToRegEx('muted'))
    }
    await userEvent.keyboard('{/Meta}{/Shift}')
  },
}

export const CanNotStrikeNonExistantCandidate: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const candidate = 1

    await userEvent.keyboard('{Meta>}{Shift>}')

    const candidateBtn = getCandidateButton(canvas, candidate)
    await userEvent.click(candidateBtn)

    await expect(candidateBtn).not.toHaveTextContent(candidate.toString())
    const strikedSvg = within(candidateBtn).queryByTitle('striked')
    await expect(strikedSvg).not.toBeInTheDocument()

    await userEvent.keyboard('{/Meta}{/Shift}')
  },
}

export const CanRemoveStrikedCandidate: Story = {
  parameters: {
    state: {
      board: [
        createCell({
          candidates: addDigit(EMPTY_MASK, 1),
          strikedCandidates: addDigit(EMPTY_MASK, 1),
        }),
      ],
    },
  },
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const candidate = 1

    const candidateBtn = getCandidateButton(canvas, candidate)
    await userEvent.keyboard('{Meta>}')
    await userEvent.click(candidateBtn)
    await userEvent.keyboard('{/Meta}')
    await expect(candidateBtn).not.toHaveTextContent(candidate.toString())
    const maybeStrikedSvg = within(candidateBtn).queryByTitle('striked')
    await expect(maybeStrikedSvg).not.toBeInTheDocument()
  },
}

export const ReAddingACandidateClearsHighlightState: Story = {
  parameters: {
    state: {
      board: [
        createCell({
          candidates: addDigit(EMPTY_MASK, 1),
          highlightedCandidates: addDigit(EMPTY_MASK, 1),
        }),
      ],
    },
  },
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const candidate = 1

    const candidateBtn = getCandidateButton(canvas, candidate)
    await expect(candidateBtn).toHaveTextContent(candidate.toString())
    await expect(candidateBtn).toHaveClass(cssSelectorToRegEx('highlight'))

    // remove candidate 1
    await userEvent.keyboard('{Meta>}')
    await userEvent.click(candidateBtn)
    await userEvent.keyboard('{/Meta}')
    await expect(candidateBtn).not.toHaveTextContent(candidate.toString())
    await expect(candidateBtn).not.toHaveClass(cssSelectorToRegEx('highlight'))

    // Select candidate 1 again
    await userEvent.click(candidateBtn)
    await expect(candidateBtn).toHaveTextContent(candidate.toString())
    await expect(candidateBtn).not.toHaveClass(cssSelectorToRegEx('highlight'))
  },
}

export const ReAddingACandidateClearsStrikeState: Story = {
  parameters: {
    state: {
      board: [
        createCell({
          candidates: addDigit(EMPTY_MASK, 1),
          strikedCandidates: addDigit(EMPTY_MASK, 1),
        }),
      ],
    },
  },
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const candidate = 1

    const candidateBtn = getCandidateButton(canvas, candidate)
    await expect(candidateBtn).toHaveTextContent(candidate.toString())
    const strikedSvg = within(candidateBtn).getByTitle('striked')
    await expect(strikedSvg).toBeInTheDocument()
    await expect(candidateBtn).toHaveClass(cssSelectorToRegEx('muted'))

    // remove candidate 1
    await userEvent.keyboard('{Meta>}')
    await userEvent.click(candidateBtn)
    await userEvent.keyboard('{/Meta}')
    await expect(candidateBtn).not.toHaveTextContent(candidate.toString())
    let maybeStrikedSvg = within(candidateBtn).queryByTitle('striked')
    await expect(maybeStrikedSvg).not.toBeInTheDocument()

    // Select candidate 1 again
    await userEvent.click(candidateBtn)
    await expect(candidateBtn).toHaveTextContent(candidate.toString())
    maybeStrikedSvg = within(candidateBtn).queryByTitle('striked')
    await expect(maybeStrikedSvg).not.toBeInTheDocument()
  },
}

export const LongPressOpensNumberSelector: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    const cellBtn = getCellButton(canvas, args.index)
    fireEvent.pointerDown(cellBtn)

    await waitFor(() => {
      getNumberSelector()
    })
  },
}

export const CanUpdateCellNumber: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const candidate = 1

    const candidateBtn = getCandidateButton(canvas, candidate) // could be any button
    fireEvent.pointerDown(candidateBtn)
    await waitFor(() => {
      const numSelector = within(getNumberSelector())
      const buttonOne = numSelector.getByRole('button', { name: '1' })
      fireEvent.pointerUp(buttonOne)
    })

    const cellBtn = await canvas.findByRole('button', { name: `cell-${args.index}` })
    await expect(cellBtn).toHaveTextContent(candidate.toString())
  },
}

export const OpeningNumberSelectorThenClosingViaESCDoesNotMarkCellCandidate: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const candidate = 5

    const candidateBtn = getCandidateButton(canvas, candidate)
    fireEvent.pointerDown(candidateBtn)
    await screen.findByRole('dialog', { name: 'number selector menu' })
    await userEvent.keyboard('{Escape}')
    await expect(
      screen.queryByRole('dialog', { name: 'number selector menu' }),
    ).not.toBeInTheDocument()
    fireEvent.pointerUp(candidateBtn)

    await expect(candidateBtn).not.toHaveTextContent(candidate.toString())
  },
}

export const CanOpenNumberSelectorFromSelectedCellOnUndiscoveredCandidate: Story = {
  parameters: {
    state: {
      board: [
        createCell({
          candidates: addDigit(EMPTY_MASK, 1),
        }),
      ],
      selectedCellIndex: 0,
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // Select candidate 1
    const candidateBtn = getCandidateButton(canvas, 1)
    await expect(candidateBtn).toHaveTextContent('1')
    const cell = getCellButton(canvas, args.index)
    await expect(cell).toHaveClass(cssSelectorToRegEx('selected'))

    // long press 5 for number selector
    const candidateFiveBtn = getCandidateButton(canvas, 5)
    fireEvent.pointerDown(candidateFiveBtn)
    const numberSelector = await screen.findByRole('dialog', { name: 'number selector menu' })
    await expect(numberSelector).toBeInTheDocument()
  },
}
