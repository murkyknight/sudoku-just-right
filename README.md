# Sudoku Just Right

### ⚠️ Note: This project is heavily under development. ⚠️

## Licence

This repository is proprietary. All rights are reserved by the copyright holder (Demian Myers). The code and assets in this repo are for evaluation and review only. You may not copy, publish, distribute, modify, or use any part of this repository without prior written permission. See [LICENSE.md](https://github.com/murkyknight/sudoku-just-right/blob/main/LICENSE.md) for more infomation.

---

## Why does this project exist?
Online Sudoku apps, to me, lack the charm of pen-and-paper Sudoku. While some offer note-taking, it's usually bare-minimum functionality with no way to highlight or strike a candidate. What's' worse, is the user experience for entering notes. Clicking a cell, clicking the "note" button, then selecting a candidate from the on-screen keypad is tedious and awkward to repeat (note-taking is essential for any challenging Sudoku). The same friction applies when selecting a number for a cell: you click the cell, then click the number pad (and hope you remembered to uncheck the notes toggle, or you'll just add a note). You can press a number key, but that breaks concentration as you look at the keyboard and move your hands.

Even writing the above felt tedious and boring. Sudoku Just Right aims to bring the fun of pen-and-paper Sudoku back, plus a range of usability and quality-of-life improvements, such as:

- Single-click candidate placement in a cell
- Long-press for single-number cell selection
- Simple keyboard shortcut + click to highlight, strike, or remove a candidate

The main goal is to speed up gameplay and sharpen focus while eliminating tedious, awkward, and repetitive button clicks.

----

A Sudoku UI built with React + TypeScript + Vite. This README explains how to build and start the app and summarizes the current features.

## Quick setup

1. Clone
   - git clone https://github.com/murkyknight/sudoku-just-right
   - cd sudoku-just-right

2. Install dependencies
   - npm install
   - (pnpm or yarn should also work)

3. Recommended Node
   - Use a recent LTS (Node 18+ recommended).

## Development

- Start development server (Vite with HMR)
  - npm run dev
  - Default: http://localhost:5173

- Run Storybook (component dev environment)
  - npm run storybook
  - Default: http://localhost:6006


## Tests

- Run unit tests:
  - npm run test

- Run Storybook tests (in terminal):
  - npm run test-storybook

## Current features (what works now)

- Core stack
  - React (v19), TypeScript, Vite
  - Zustand (with Immer and DevTools) for state management (will also add persist for local game persistence)
  - open-props for styling primitives
  - Vitest for tests and Storybook for component development

- Cells & state
  - Candidate handling
    - Candidates are stored and manipulated via compact bitmask helpers for lighting fast mutations:
      - addDigit, removeDigit, hasDigit, addDigits
    - Candidate actions:
      - Normal click: add/toggle candidate
      - Ctrl + click: highlight candidate (also adds candidate if missing)
      - Meta (Cmd/Win) + click: remove candidate
      - Shift + Meta + click: strike a candidate

- Number selector
  - Long-press (or keyboard Enter/Space) opens a Number Selector dialog (rendered via a react portal).
  - The Number Selector allows placing a digit or erasing the cell value in one click and hold action.
  - Escape also closes the selector and deselects the cell.

- Store & helpers
  - Global store is in src/components/store/useGameStore.ts, built with Zustand + immer.
  - Conflict detection and peer updates are handled via helpers referenced from the store.

## Coming features

- Undo/Redo - to quickly undo mistakes or misclicks (keyboard shortcut native, of course)
- Gentle Hints - that encourage and empower the player by explaining the technique behind the hint while highlighting the house the hint relates to so the player can discover it themselves.
- Batch candidate updates - click and drag across multiple cells to update all candidates
- Draft Mode - toggle draft mode to help with forcing chains - update the board in any way then untoggle to return to your original game state.


## Contributing / Development notes

- This repository is private and under active development. Expect changes and possible breaking refactors.
