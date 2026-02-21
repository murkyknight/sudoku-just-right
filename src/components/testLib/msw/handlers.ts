import type { SudokuPuzzleSource } from '@/components/DifficultySelector/api'
import type { RootManifest, VersionManifest } from '@/types'
import { http, HttpResponse, type RequestHandler } from 'msw'
import { createRootManifest, generatePuzzleSources } from '../helpers'

const BASE_URL = import.meta.env.VITE_SJR_PUZZLE_BASE_URL

const defaultVersionManifest: VersionManifest = {
  version: 'v1',
  basePath: '/sudoku/v1/',
  difficulties: {
    easy: {
      difficulty: 'easy',
      chunks: 200,
      chunkSize: 500,
      totalPuzzles: 100000,
      chunkPadding: 4,
      basePath: '/sudoku/v1/easy/',
    },
    medium: {
      difficulty: 'medium',
      chunks: 354,
      chunkSize: 500,
      totalPuzzles: 176643,
      chunkPadding: 4,
      basePath: '/sudoku/v1/medium/',
    },
  },
}

export const manifestHandler = (
  rootManiDefault: RootManifest = createRootManifest('v1'),
): RequestHandler => {
  return http.get(`${BASE_URL}/manifest.json`, () => {
    return HttpResponse.json(rootManiDefault)
  })
}

export const versionManifest = (): RequestHandler => {
  return http.get(`${BASE_URL}/v1/manifestPath/manifest.json`, () => {
    return HttpResponse.json(defaultVersionManifest)
  })
}

export const puzzleSourceHandler = (
  puzzleSources: SudokuPuzzleSource[] = generatePuzzleSources(5, 'easy'),
): RequestHandler => {
  return http.get(`${BASE_URL}/sudoku/v1/easy/*`, () => {
    return HttpResponse.json(puzzleSources)
  })
}

export const defaultHandlers = (overrides: RequestHandler[] = []) => {
  const defaults = [manifestHandler(), versionManifest(), puzzleSourceHandler()]
  // overrides take precedence — msw uses first-match wins
  return [...overrides, ...defaults]
}
