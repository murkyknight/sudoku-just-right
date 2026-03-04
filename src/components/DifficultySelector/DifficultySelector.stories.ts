import type { Meta, StoryObj } from "@storybook/react-vite"

import { expect, mocked, waitFor, within } from "storybook/test"
import { generatePuzzleSources, resetGameStore } from "../testLib/helpers"
import { defaultHandlers, puzzleSourceHandler } from "../testLib/msw/handlers"
import DifficultySelector from "./DifficultySelector"
import { getXRandomUniqueNumbers } from "./helpers"

const meta = {
  title: "Board/DifficultySelector",
  component: DifficultySelector,
  beforeEach() {
    resetGameStore({ gamePhase: "loading" })
    mocked(getXRandomUniqueNumbers).mockReturnValue([0, 1, 2, 3, 4])
  },
  parameters: {
    layout: "centered",
    msw: {
      handlers: defaultHandlers(),
    },
  },
} satisfies Meta<typeof DifficultySelector>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const difficultyBtn = await canvas.findByLabelText(/Toggle Breezy/i)
    const buttonState = difficultyBtn.dataset.state
    expect(buttonState).toEqual("on")
  },
}

export const ContainsAllDifficulties: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    expect(canvas.getByLabelText(/Breezy/i)).toBeInTheDocument()
    expect(canvas.getByLabelText(/Mild/i)).toBeInTheDocument()
    expect(canvas.getByLabelText(/Tough/i)).toBeInTheDocument()
    expect(canvas.getByLabelText(/Nasty/i)).toBeInTheDocument()
    expect(canvas.getByLabelText(/Brutal/i)).toBeInTheDocument()
    expect(canvas.getByLabelText(/Sorry/i)).toBeInTheDocument()
  },
}

export const CanSelectAnotherDifficulty: Story = {
  parameters: {
    msw: {
      handlers: defaultHandlers([
        puzzleSourceHandler(generatePuzzleSources(5, "medium")),
      ]),
    },
  },
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)

    const difficultyBtn = await canvas.findByLabelText(/Mild/i)

    await waitFor(() => {
      userEvent.click(difficultyBtn)
      const buttonState = difficultyBtn.dataset.state
      expect(buttonState).toEqual("on")
    })
  },
}
