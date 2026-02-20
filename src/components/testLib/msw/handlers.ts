import type { SudokuPuzzleSource } from '@/components/DifficultySelector/api'
import type { RootManifest, VersionManifest } from '@/types'
import { http, HttpResponse } from 'msw'
import { createRootManifest, generatePuzzleSources } from '../helpers'

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

export const manifestHandler = (rootManiDefault: RootManifest = createRootManifest('v1')) => {
  return http.get('https://sjr-puzzles.pages.dev/manifest.json', () => {
    return HttpResponse.json(rootManiDefault)
  })
}

export const versionManifest = () => {
  return http.get('https://sjr-puzzles.pages.dev/v1/manifestPath/manifest.json', () => {
    return HttpResponse.json(defaultVersionManifest)
  })
}

export const puzzleSourceHandler = (puzzleSources: SudokuPuzzleSource[] = generatePuzzleSources(5, 'easy')) => {
  return http.get('https://sjr-puzzles.pages.dev/sudoku/v1/easy/*', () => {
    return HttpResponse.json(puzzleSources)
  })
}

export const handlers = () => {
  return [
    manifestHandler,
    versionManifest,
    puzzleSourceHandler,
  ]
}
