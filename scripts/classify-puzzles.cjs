#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

/**
 * classify-puzzles.cjs
 *
 * Command-line utility that parses a raw puzzle bank text file and classifies each puzzle
 * into difficulty buckets according to the project's rating thresholds. The script merges
 * parsed puzzles into per-difficulty JSON files in an output directory and maintains a
 * pages.json index with counts for each difficulty.
 * 
 * Default outputDir: ./out
 *
 * Behaviour summary
 * - Input: a required plain-text file where each non-empty line has three whitespace-separated
 *   tokens: id, board, rating
 *     - id:  unique puzzle hash (string)
 *     - board: 81-character raw sudoku string (digits 0-9; '0' or '0' for empty cells)
 *     - rating: numeric rating (string that can be cast to Number)
 * - Parsing: each line is parsed into an object { id, difficulty, rating, board } where
 *   difficulty is derived from the numeric rating using the project's thresholds:
 *     - easy:    rating <= 1.2
 *     - medium:  1.5 <= rating <= 1.9
 *     - hard:    2.0 <= rating <= 2.9
 *     - expert:  3.0 <= rating <= 4.9
 *     - intense: 5.0 <= rating <= 7.9
 *     - master:  rating >= 8.0
 *     - unknown: if rating is missing/invalid or outside mapped ranges
 * - Output:
 *   - For each difficulty encountered, a single lowercase JSON file is written to the output
 *     directory (default './out' or specified with --out). Filenames look like:
 *       easy.json, medium.json, hard.json, expert.json, intense.json, master.json, unknown.json
 *   - Each per-difficulty file contains a JSON array of puzzle objects. If a file already
 *     exists it is read and merged with the new puzzles; existing entries are preserved and
 *     new puzzles are appended in input order
 *   - Duplicate handling: puzzles are de-duplicated by `id`. If an incoming puzzle has an id
 *     that already exists in the destination file, the existing entry is kept and the incoming
 *     one is skipped
 *   - pages.json: an index file written to the same output directory that maps difficulty keys
 *     to { filename, count }. If pages.json already exists it is merged: counts for difficulties
 *     processed during this run are updated; entries for other difficulties are preserved
 *
 * CLI usage
 *   node classify-puzzles.cjs <inputFile> [--out <outputDir>]
 *
 * Examples
 *   node classify-puzzles.cjs raw-bank.txt
 *   node classify-puzzles.cjs raw-bank.txt --out ./data
 */


// Simple CLI parsing for positional inputFile and --out <dir>
const argv = process.argv.slice(2)
if (!argv.length) {
  console.error('Error: input file required. Usage: node parse-puzzles.js <inputFile> [--out outputDir]')
  process.exit(1)
}

let inputFile = null
let outDir = 'out'
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === '--out' || a === '-o') {
    if (i + 1 >= argv.length) {
      console.error('Error: --out requires a directory argument')
      process.exit(1)
    }
    outDir = argv[i + 1]
    i++
  } else if (!inputFile) {
    inputFile = a
  } else {
    // ignore extras
  }
}

if (!inputFile) {
  console.error('Error: input file required. Usage: node parse-puzzles.js <inputFile> [--out outputDir]')
  process.exit(1)
}

// Normalise paths
inputFile = path.resolve(process.cwd(), inputFile)
outDir = path.resolve(process.cwd(), outDir)

function ratingToDifficulty(ratingNum) {
  if (!Number.isFinite(ratingNum)) return 'unknown'
  if (ratingNum <= 1.2) return 'easy'
  if (ratingNum >= 1.3 && ratingNum <= 1.9) return 'medium'
  if (ratingNum >= 2.0 && ratingNum <= 2.9) return 'hard'
  if (ratingNum >= 3.0 && ratingNum <= 4.9) return 'pro'
  if (ratingNum >= 5.0 && ratingNum <= 7.9) return 'expert'
  if (ratingNum >= 8.0) return 'master'
  return 'unknown'
}

// Parse a line where format is: "<id> <board81chars>  <rating>"
// We assume first token is id, second token is full board, last token is rating
// Because your raw format is consistent we can directly map parts[0], parts[1], parts[2]
function parseLine(line, lineNumber) {
  const raw = line.trim()
  if (!raw) return null

  // split by whitespace; expected exactly 3 tokens in normal cases
  const parts = raw.split(/\s+/)
  if (parts.length < 3) {
    console.warn(`Line ${lineNumber}: malformed (fewer than 3 tokens), skipping: "${line}"`)
    return null
  }

  const id = parts[0]
  const board = parts[1]
  const ratingStr = parts[2]

  const ratingNum = Number(ratingStr)
  const difficulty = ratingToDifficulty(ratingNum)

  if (board.length !== 81) {
    console.warn(`Line ${lineNumber}: board length is ${board.length} (expected 81). ID=${id}`)
  }

  return {
    id,
    difficulty, // lower-case
    rating: ratingStr,
    board
  }
}

// Output filenames are lowercase: e.g. medium.json
function filenameForDifficulty(key) {
  if (!key) return 'unknown.json'
  return `${key.toLowerCase()}.json`
}

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

// Read existing single-file JSON for a difficulty (lowercase filename)
function readExistingForDifficulty(difficultyKey, outDirPath) {
  const fileName = filenameForDifficulty(difficultyKey)
  const singleFile = path.join(outDirPath, fileName)
  if (!fs.existsSync(singleFile)) return []
  try {
    const raw = fs.readFileSync(singleFile, 'utf8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    console.warn(`Warning: ${singleFile} does not contain a JSON array. Ignoring file`)
    return []
  } catch (err) {
    console.warn(`Warning: Failed to parse ${singleFile}: ${err.message}. Ignoring file`)
    return []
  }
}

// Merge existing and new puzzles, avoiding duplicates by id.
// Existing entries are kept; new ones with duplicate ids are skipped.
function mergeAvoidingDuplicates(existingItems, newItems) {
  const existingIds = new Set(existingItems.map(i => i.id))
  const merged = [...existingItems]
  let added = 0
  for (const n of newItems) {
    if (!existingIds.has(n.id)) {
      merged.push(n)
      existingIds.add(n.id)
      added++
    }
  }
  return { merged, added }
}

// Read existing pages.json index if any; return {} if none or invalid
function readExistingIndex(outDirPath) {
  const idxPath = path.join(outDirPath, 'pages.json')
  if (!fs.existsSync(idxPath)) return {}
  try {
    const raw = fs.readFileSync(idxPath, 'utf8')
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    console.warn('Warning: existing pages.json is not an object. Ignoring it')
    return {}
  } catch (err) {
    console.warn(`Warning: Failed to parse existing pages.json: ${err.message}. Ignoring it`)
    return {}
  }
}

function writeGroupsToFiles(groups, outDirPath) {
  ensureDirExists(outDirPath)

  const existingIndex = readExistingIndex(outDirPath)
  const newIndexEntries = {}

  for (const [difficultyKey, newItems] of Object.entries(groups)) {
    if (!newItems.length) continue
    const filename = filenameForDifficulty(difficultyKey)
    const filePath = path.join(outDirPath, filename)

    const existingItems = readExistingForDifficulty(difficultyKey, outDirPath)
    const { merged, added } = mergeAvoidingDuplicates(existingItems, newItems)

    if (!merged.length) {
      console.log(`No items to write for ${difficultyKey} (merged set empty)`)
      continue
    }

    fs.writeFileSync(filePath, JSON.stringify(merged, null, 4) + '\n', 'utf8')
    console.log(`Wrote ${merged.length} total puzzles to ${path.relative(process.cwd(), filePath)} (${added} added, ${existingItems.length} existing)`)

    newIndexEntries[difficultyKey] = {
      filename,
      count: merged.length
    }
  }

  // Merge existingIndex and newIndexEntries
  const mergedIndex = { ...existingIndex }
  for (const [k, v] of Object.entries(newIndexEntries)) {
    mergedIndex[k] = v
  }

  const indexPath = path.join(outDirPath, 'pages.json')
  fs.writeFileSync(indexPath, JSON.stringify(mergedIndex, null, 4) + '\n', 'utf8')
  console.log(`Updated index ${path.relative(process.cwd(), indexPath)}`)
}

function main() {
  if (!fs.existsSync(inputFile)) {
    console.error(`Input file not found: ${inputFile}`)
    process.exit(1)
  }

  const raw = fs.readFileSync(inputFile, 'utf8')
  const lines = raw.split(/\r?\n/)

  const parsed = []
  for (let i = 0; i < lines.length; i++) {
    const p = parseLine(lines[i], i + 1)
    if (p) parsed.push(p)
  }

  if (!parsed.length) {
    console.log('No valid puzzles found.')
    return
  }

  // Group new puzzles by difficulty preserving input order
  const groups = {}
  for (const p of parsed) {
    if (!groups[p.difficulty]) groups[p.difficulty] = []
    groups[p.difficulty].push(p)
  }

  writeGroupsToFiles(groups, outDir)
}

main()
