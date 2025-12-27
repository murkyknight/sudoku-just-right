import type { Meta, StoryObj } from '@storybook/react-vite'

import { within } from '@testing-library/react'
import { expect, fn } from 'storybook/test'
import NumberSelector from './NumberSelector'

const meta = {
  title: 'Board/Cell/NumberSelector',
  component: NumberSelector,
  args: {
    onSelect: fn(),
    onClose: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative' }}>
        <div data-testid="outside">Outside area</div>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof NumberSelector>

type Canvas = ReturnType<typeof within>

const getDigitButton = (canvas: Canvas, digit: number | string) =>
  canvas.getByRole('button', { name: digit })

const buttonNumberOne = 1

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const numberSelector = canvas.getByRole('dialog', { name: 'number selector menu' })

    expect(numberSelector).toBeInTheDocument()
  },
}

export const SelectsNumber: Story = {
  play: async ({ canvasElement, userEvent, args }) => {
    const canvas = within(canvasElement)

    const { onSelect } = args
    for (let digit = 1; digit <= 9; digit++) {
      const digitBtn = getDigitButton(canvas, digit)
      await userEvent.click(digitBtn)

      expect(onSelect).toHaveBeenCalledTimes(digit)
      expect(onSelect).toHaveBeenCalledWith(digit)
    }
  },
}

export const SelectsEraser: Story = {
  play: async ({ canvasElement, userEvent, args }) => {
    const canvas = within(canvasElement)
    const digitBtn = getDigitButton(canvas, 'cell number eraser')
    await userEvent.click(digitBtn)

    const { onSelect } = args
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(undefined) // earser sets undeifned
  },
}

export const ClickOutsideClosesMenu: Story = {
  play: async ({ canvasElement, userEvent, args }) => {
    within(canvasElement)
    await userEvent.keyboard('{Escape}')

    const { onClose } = args
    expect(onClose).toHaveBeenCalledTimes(1)
  },
}

export const EscapeClosesMenu: Story = {
  play: async ({ canvasElement, userEvent, args }) => {
    const canvas = within(canvasElement)
    const outsideComp = canvas.getByTestId('outside')
    await userEvent.click(outsideComp)

    const { onClose } = args
    expect(onClose).toHaveBeenCalledTimes(1)
  },
}
