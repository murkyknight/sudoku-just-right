
// TODO: This file will become unwieldy. Instead, we should create a types directory
// and add specific type files, e.g., /types/difficulty.ts
export const difficultyType = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  PRO: 'pro',
  EXPERT: 'expert',
  MASTER: 'master',
} as const

export type Difficulty = (typeof difficultyType)[keyof typeof difficultyType]

export interface VersionEntry {
  basePath: string
  manifestPath: string
}

export interface RootManifest {
  currentVersion: string
  versions: Record<string, VersionEntry>
}

export interface DifficultyManifestEntry {
  difficulty: string;
  chunks: number;
  chunkSize: number;
  totalPuzzles: number;
  chunkPadding: number;
  basePath: string;
}

export interface VersionManifest {
  version: string;
  basePath: string;
  difficulties: Record<string, DifficultyManifestEntry>;
}

