import type { Meta, StoryObj } from '@storybook/react-vite'
import { fireEvent, within } from '@testing-library/react'
import { useEffect } from 'react'
import { expect, screen, waitFor } from 'storybook/test'
import useGameStore from '../store/useGameStore'
import Cell from './Cell'

// TODO: pull out make more generic so we can pass in state
const StoreWrapper = ({ children }: { children: React.ReactNode }) => {
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
    })
  }, [])

  return <>{children}</>
}

// TODO: refactor these tests by setting up state needed for each test with
// custom decorator and test util helpers
const meta = {
  title: 'Board/Cell',
  component: Cell,
  args: {
    index: 0,
  },
  decorators: [
    (Story) => (
      <StoreWrapper>
        <div>
          <div data-testid="outside" />
          <Story />
        </div>
      </StoreWrapper>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Cell>

type Canvas = ReturnType<typeof within>

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
    await expect(cell).not.toHaveClass('selected')
  },
}

export const CanSelectCellCandidates: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)

    for (let candidate = 1; candidate <= 9; candidate++) {
      const candidateBtn = getCandidateButton(canvas, candidate)
      await userEvent.click(candidateBtn)
      await expect(candidateBtn).toHaveTextContent(candidate.toString())
    }
  },
}

export const ClickingCandidateSelectsCell: Story = {
  play: async ({ canvasElement, userEvent, args }) => {
    const canvas = within(canvasElement)
    const candidate = 5
    const candidateBtn = getCandidateButton(canvas, candidate)
    await userEvent.click(candidateBtn)

    const cell = getCellButton(canvas, args.index)
    await expect(cell).toHaveClass('selected')
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
      await expect(candidateBtn).toHaveClass('highlight')
    }
    await userEvent.keyboard('{/Control}')
  },
}

export const CanRemoveCellCandidates: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)

    for (let candidate = 1; candidate <= 9; candidate++) {
      const candidateBtn = getCandidateButton(canvas, candidate)
      await userEvent.click(candidateBtn)
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
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)

    for (let candidate = 1; candidate <= 9; candidate++) {
      const candidateBtn = getCandidateButton(canvas, candidate)
      await userEvent.click(candidateBtn)

      await expect(candidateBtn).toHaveTextContent(candidate.toString())
    }

    await userEvent.keyboard('{Meta>}{Shift>}')
    for (let candidate = 1; candidate <= 9; candidate++) {
      const candidateBtn = getCandidateButton(canvas, candidate)
      await userEvent.click(candidateBtn)

      await expect(candidateBtn).toHaveTextContent(candidate.toString())
      const strikedSvg = within(candidateBtn).getByTitle('striked')
      await expect(strikedSvg).toBeInTheDocument()
      await expect(candidateBtn).toHaveClass('muted')
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
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const candidate = 1

    // Click candidate 1
    const candidateBtn = getCandidateButton(canvas, candidate)
    await userEvent.click(candidateBtn)
    await expect(candidateBtn).toHaveTextContent(candidate.toString())

    // Strike candidate 1
    await userEvent.keyboard('{Meta>}{Shift>}')
    await userEvent.click(candidateBtn)
    await userEvent.keyboard('{/Meta}{/Shift}')
    await expect(candidateBtn).toHaveTextContent(candidate.toString())
    const strikedSvg = within(candidateBtn).getByTitle('striked')
    await expect(strikedSvg).toBeInTheDocument()
    await expect(candidateBtn).toHaveClass('muted')

    // remove candidate 1
    await userEvent.keyboard('{Meta>}')
    await userEvent.click(candidateBtn)
    await userEvent.keyboard('{/Meta}')
    await expect(candidateBtn).not.toHaveTextContent(candidate.toString())
    const maybeStrikedSvg = within(candidateBtn).queryByTitle('striked')
    await expect(maybeStrikedSvg).not.toBeInTheDocument()
  },
}

export const ReAddingACandidateClearsHighlightState: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const candidate = 1

    // Select candidate 1
    const candidateBtn = getCandidateButton(canvas, candidate)
    await userEvent.click(candidateBtn)
    await expect(candidateBtn).toHaveTextContent(candidate.toString())

    // Strike candidate 1
    await userEvent.keyboard('{Meta>}{Shift>}')
    await userEvent.click(candidateBtn)
    await userEvent.keyboard('{/Meta}{/Shift}')
    await expect(candidateBtn).toHaveTextContent(candidate.toString())
    const strikedSvg = within(candidateBtn).getByTitle('striked')
    await expect(strikedSvg).toBeInTheDocument()
    await expect(candidateBtn).toHaveClass('muted')

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

export const ReAddingACandidateClearsStrikeState: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const candidate = 1

    // Select candidate 1
    const candidateBtn = getCandidateButton(canvas, candidate)
    await userEvent.click(candidateBtn)
    await expect(candidateBtn).toHaveTextContent(candidate.toString())

    // highlight candidate 1
    await userEvent.keyboard('{Control>}')
    await userEvent.click(candidateBtn)
    await userEvent.keyboard('{/Control}')
    await expect(candidateBtn).toHaveTextContent(candidate.toString())
    await expect(candidateBtn).toHaveClass('highlight')

    // remove candidate 1
    await userEvent.keyboard('{Meta>}')
    await userEvent.click(candidateBtn)
    await userEvent.keyboard('{/Meta}')
    await expect(candidateBtn).not.toHaveTextContent(candidate.toString())
    await expect(candidateBtn).not.toHaveClass('highlight')

    // Select candidate 1 again
    await userEvent.click(candidateBtn)
    await expect(candidateBtn).toHaveTextContent(candidate.toString())
    await expect(candidateBtn).not.toHaveClass('highlight')
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

export const OpeningNumberSelectorThenClosingDoesNotMarkCellCandidate: Story = {
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
  play: async ({ canvasElement, userEvent, args }) => {
    const canvas = within(canvasElement)

    // Select candidate 1
    const candidateBtn = getCandidateButton(canvas, 1)
    await userEvent.click(candidateBtn)
    await expect(candidateBtn).toHaveTextContent('1')
    const cell = getCellButton(canvas, args.index)
    await expect(cell).toHaveClass('selected')

    // long press 5 for number selector
    getCandidateButton(canvas, 5)
    fireEvent.pointerDown(candidateBtn)
    const numberSelector = await screen.findByRole('dialog', { name: 'number selector menu' })
    await expect(numberSelector).toBeInTheDocument()
  },
}

export const ClickingOutsideCellDeselectsIt: Story = {
  play: async ({ canvasElement, userEvent, args }) => {
    const canvas = within(canvasElement)
    const candidate = 5
    const candidateBtn = getCandidateButton(canvas, candidate)
    await userEvent.click(candidateBtn)
    const cell = getCellButton(canvas, args.index)
    await expect(cell).toHaveClass('selected')

    const outsideComp = canvas.getByTestId('outside')
    await userEvent.click(outsideComp)

    await expect(cell).not.toHaveClass('selected')
  },
}