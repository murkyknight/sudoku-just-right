import { fireEvent, screen, waitFor, within } from 'storybook/test'

export type Canvas = ReturnType<typeof within>

const getNumberSelector = (): HTMLElement =>
  screen.getByRole('dialog', { name: 'number selector menu' })

export const getCellButton = (canvas: Canvas, index: number): HTMLElement =>
  canvas.getByRole('button', { name: `cell-${index}` })

export const findCellButton = async (canvas: Canvas, index: number): Promise<HTMLElement> =>
  canvas.findByRole('button', { name: `cell-${index}` })

export const selectNumber = async (element: HTMLElement, value: string) => {
    fireEvent.pointerDown(element)
    await waitFor(() => {
      const numSelector = within(getNumberSelector())
      const buttonOne = numSelector.getByRole('button', { name: value })
      fireEvent.pointerUp(buttonOne)
    })
}
