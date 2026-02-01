<!-- Short, targeted guidance for AI coding agents working in this repo -->
# Copilot Instructions — Sudoku Just Right

This file gives focused, actionable guidance for AI coding agents to be productive quickly in this repository.

- Big picture: a React + TypeScript + Vite app that renders a single `GameBoard` UI. Component development is done in Storybook. State is managed with `zustand` + `immer` and candidates are stored as compact bitmasks for performance.

- Key entry points & files:
  - `src/main.tsx` — app entry that mounts `GameBoard`.
  - `src/components/GameBoard.tsx` — top-level game UI (component tree roots here).
  - `src/components/store/useGameStore.ts` — global state (important: exposes `createUseStore()` for tests and a default singleton `useGameStore`). Prefer `createUseStore()` when creating isolated stores in tests.
  - `src/components/utils/bitMaskHelper.ts` — candidate bitmask helpers (addDigit, removeDigit, hasDigit, addDigits). Use these helpers when manipulating candidate masks.
  - `src/components/NumberSelector/*` and `src/components/Cell/*` — examples of portals and long-press/key handling patterns.
  - `.storybook/` — storybook config and tests (Storybook-driven integration tests are enabled via Vitest plugin).
  - `scripts/` — node scripts for puzzle chunking/classification (cjs modules).

- Development & test workflows (use these exact npm scripts from `package.json`):
  - `npm run dev` — start Vite dev server (HMR).
  - `npm run build` — `tsc -b && vite build` (run TypeScript build before bundling).
  - `npm run storybook` — run Storybook UI at port 6006.
  - `npm run test` — run unit tests (Vitest `unit` project).
  - `npm run test-storybook` — run Storybook tests (heavier; uses Playwright/Chromium headless). Ensure Playwright browsers are installed if running locally.
  - `npm run lint` / `npm run format` — use `biome` for lint/format checks.

- Testing notes & conventions:
  - Vitest is configured with two projects in `vitest.config.ts`: `unit` (fast jsdom unit tests) and `storybook` (Storybook integration tests using Playwright). Use `--project` to target one.
  - Tests rely on `vitest.setup.ts` and `.storybook/vitest.setup.ts` — set up globals there.

- Patterns & project-specific conventions:
  - State: prefer using `immer`-based mutations inside `zustand` set callbacks (see `useGameStore.ts`). Returning early inside a mutating callback is the sanctioned no-op pattern.
  - Bitmask candidates: always use `bitMaskHelper` helpers rather than ad-hoc bit operations at call sites.
  - CSS: uses CSS modules for component-scoped styles (files named `*.module.css`). Tests use `identity-obj-proxy` mapping for these.
  - Aliases: `@` maps to `./src` (see `vite.config.ts`) — prefer `@/components/...` for top-level imports.
  - Storybook stories live alongside components (e.g., `Component.stories.tsx`). Storybook tests expect the `.storybook` config dir.

- Integration and environment pointers:
  - The repo uses Tailwind via `@tailwindcss/vite` and `tailwind.config.cjs`.
  - Dev tooling: `biome` for linting/formatting; `vitest` for tests; `storybook` for component UI.
  - Keep Node >= 18 (recommended in README).

- When modifying state or adding features that affect candidates or conflicts:
  - Update `src/components/store/helpers/draftHelpers.ts` if conflict logic changes.
  - Ensure unit tests cover `addCandidate`/`removeCandidate` and conflict helpers; use `createUseStore()` to create isolated stores for tests.

- Small implementation examples to copy/paste:
  - Create isolated store in tests:
    ```ts
    import { createUseStore } from '@/components/store/useGameStore'
    const useStore = createUseStore()
    // then render components with provider if needed or call store methods directly
    ```
  - Use bitmask helper:
    ```ts
    import { addDigit, removeDigit, hasDigit } from '@/components/utils/bitMaskHelper'
    const newMask = addDigit(currentMask, 3)
    ```

**Testing convention:**
- Unit tests must follow the three A's: Arrange, Act, Assert. Keep tests small, deterministic, and focused on a single behavior.

**Code style & philosophy:**
- Strive for simplicity, readability, and maintainability. Avoid flashy patterns; prefer straightforward, easy-to-read code.

**Styling / Colors:**
- Always prefer using Open Props colors (see `tailwind.config.cjs` and `open-props` in `package.json`). When you need transparency, use Open Props' HSL values and apply alpha via HSL syntax.

If anything here is unclear or you want a different level of detail (e.g., include common code snippets, testing recipes, or CI hints), tell me which sections to expand. Thank you!

**Unit test templates (Arrange / Act / Assert):**
- Utility function example (`src/components/utils/bitMaskHelper.ts`):
  ```ts
  import { addDigit } from '@/components/utils/bitMaskHelper'

  describe('addDigit', () => {
    test('adds a digit to empty mask', () => {
      // Arrange
      const start = 0

      // Act
      const result = addDigit(start, 3)

      // Assert
      expect(result).toBe(1 << (3 - 1))
    })
  })
  ```

  Note: follow the Arrange/Act/Assert structure in tests, but do not include the literal comment lines `// Arrange`, `// Act`, or `// Assert` in committed tests — keep tests clean.

- Store action example (`src/components/store/useGameStore.ts`):
  ```ts
  import { createUseStore } from '@/components/store/useGameStore'

  describe('useGameStore - addCandidate', () => {
    test('adds a candidate to an empty cell', () => {
      // Arrange
      const useStore = createUseStore()
      const { addCandidate } = useStore.getState()
      const index = 0
      const value = 5

      // Act
      addCandidate(index, value)

      // Assert
      const cell = useStore.getState().board[index]
      expect(cell.candidates).toBe(1 << (value - 1))
    })
  })
  ```
- Utility function example (`src/components/utils/bitMaskHelper.ts`):
  ```ts
  import { addDigit } from '@/components/utils/bitMaskHelper'

  describe('addDigit', () => {
    test('adds a digit to empty mask', () => {
      // Arrange
      const start = 0

      // Act
      const result = addDigit(start, 3)

      // Assert
      expect(result).toBe(1 << (3 - 1))
    })
  })
  ```

- Store action example (`src/components/store/useGameStore.ts`):
  ```ts
  import { createUseStore } from '@/components/store/useGameStore'

  describe('useGameStore - addCandidate', () => {
    test('adds a candidate to an empty cell', () => {
      // Arrange
      const useStore = createUseStore()
      const { addCandidate } = useStore.getState()
      const index = 0
      const value = 5

      // Act
      addCandidate(index, value)

      // Assert
      const cell = useStore.getState().board[index]
      expect(cell.candidates).toBe(1 << (value - 1))
    })
  })
  ```
