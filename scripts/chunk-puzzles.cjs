#!/usr/bin/env node

/**
 * Usage:
 *   node chunk-puzzles.cjs <inputFile|inputDir> [--out <outputRoot>] [--size <chunkSize>]
 * 
 * Chunk per-difficulty JSON files into zero-padded numeric chunk files and maintain a manifest.
 *
 * Behaviour summary:
 * - Accepts a single JSON file or a directory of JSON files containing arrays of puzzle objects
 *   (expected fields: id, difficulty, rating, board)
 * - Splits arrays into chunk files of configurable size (default 500), named with 4-digit zero
 *   padding (0000.json, 0001.json, ...)
 * - Creates one directory per difficulty (outputRoot/<difficulty>/) and writes chunk files there
 * - Uses an existing manifest.json to pick up where it left off: fills the last partial chunk
 *   if present, then continues creating subsequent chunks
 * - Updates (merges) manifest.json with per-difficulty metadata:
 *     { chunks, chunkSize, lastFile, totalPuzzles }
 *
 * Notes:
 * - The script trusts input data (no deduplication by id); it validates minimal object shape
 * - Manifest is updated atomically to avoid partial writes
 */

const fs = require('fs')
const path = require('path')

/* -----------------------
   CLI parsing (unchanged)
   ----------------------- */
const argv = process.argv.slice(2)
if (!argv.length) {
  console.error('Error: input file or directory required. Usage: node chunk-puzzles.cjs <inputFile|inputDir> [--out <outputRoot>] [--size <chunkSize>]')
  process.exit(1)
}

let inputArg = null
let outRoot = null
let chunkSize = 500

for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === '--out' || a === '-o') {
    if (i + 1 >= argv.length) {
      console.error('Error: --out requires a directory argument')
      process.exit(1)
    }
    outRoot = argv[i + 1]
    i++
  } else if (a === '--size' || a === '-s') {
    if (i + 1 >= argv.length) {
      console.error('Error: --size requires a numeric argument')
      process.exit(1)
    }
    const n = Number(argv[i + 1])
    if (!Number.isFinite(n) || n <= 0) {
      console.error('Error: --size must be a positive integer')
      process.exit(1)
    }
    chunkSize = Math.floor(n)
    i++
  } else if (!inputArg) {
    inputArg = a
  } else {
    // ignore extras
  }
}

if (!inputArg) {
  console.error('Error: input file or directory required. Usage: node chunk-puzzles.cjs <inputFile|inputDir> [--out <outputRoot>] [--size <chunkSize>]')
  process.exit(1)
}

inputArg = path.resolve(process.cwd(), inputArg)
if (outRoot) outRoot = path.resolve(process.cwd(), outRoot)

/* -----------------------
   Constants & helpers
   ----------------------- */
const PADDING_WIDTH = 4

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
}

function isJsonFilename(name) {
  return name.toLowerCase().endsWith('.json')
}

function zeroPadNumber(number, width) {
  const s = String(number)
  if (s.length >= width) return s
  return '0'.repeat(width - s.length) + s
}

/* -----------------------
   Manifest helpers
   ----------------------- */
function readManifest(manifestPath) {
  if (!fs.existsSync(manifestPath)) return {}
  try {
    const raw = fs.readFileSync(manifestPath, 'utf8')
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    console.warn('Warning: existing manifest.json is not an object — invalid entries ignored')
    return {}
  } catch (err) {
    console.warn(`Warning: failed to parse existing manifest.json: ${err.message}`)
    return {}
  }
}

function writeManifestAtomically(manifestPath, manifestObject) {
  const tmpPath = manifestPath + '.tmp'
  fs.writeFileSync(tmpPath, JSON.stringify(manifestObject, null, 4) + '\n', 'utf8')
  fs.renameSync(tmpPath, manifestPath)
}

/* -----------------------
   Chunk file helpers
   ----------------------- */
// ... (same small helper functions as before: listNumericChunkFiles, readJsonArrayFile, writeJsonArrayFile, appendItemsToJsonArrayFile)

function listNumericChunkFiles(directory) {
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) return []
  const entries = fs.readdirSync(directory)
  const numericEntries = entries.map(name => {
    const m = name.match(/^(\d+)\.json$/)
    if (!m) return null
    return { filename: name, index: Number(m[1]) }
  }).filter(Boolean).sort((a, b) => a.index - b.index)
  return numericEntries
}

function readJsonArrayFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      console.warn(`Warning: ${filePath} does not contain a JSON array`)
      return null
    }
    return parsed
  } catch (err) {
    console.warn(`Warning: failed to read/parse ${filePath}: ${err.message}`)
    return null
  }
}

function writeJsonArrayFile(filePath, array) {
  fs.writeFileSync(filePath, JSON.stringify(array, null, 4) + '\n', 'utf8')
}

function appendItemsToJsonArrayFile(filePath, items) {
  if (fs.existsSync(filePath)) {
    const existing = readJsonArrayFile(filePath) || []
    const combined = existing.concat(items)
    writeJsonArrayFile(filePath, combined)
  } else {
    writeJsonArrayFile(filePath, items)
  }
}

/* -----------------------
   Puzzle validation
   ----------------------- */
function isPuzzleObject(candidate) {
  if (!candidate || typeof candidate !== 'object') return false
  if (!('id' in candidate) || !('difficulty' in candidate) || !('rating' in candidate) || !('board' in candidate)) return false
  return true
}

/* -----------------------
   Load and filter input
   ----------------------- */
function loadJsonArrayFromFile(filePath) {
  return readJsonArrayFile(filePath)
}

function validateAndFilterPuzzles(rawArray, sourcePath) {
  const valid = []
  for (let i = 0; i < rawArray.length; i++) {
    const item = rawArray[i]
    if (!isPuzzleObject(item)) {
      console.warn(`Warning: skipping invalid puzzle at index ${i} in ${sourcePath}`)
      continue
    }
    valid.push(item)
  }
  return valid
}

/* -----------------------
   Determine where to start writing (pick up where left off)
   ----------------------- */
function determineStartChunkIndexAndFill(targetDirectory, manifestEntry) {
  const numericFiles = listNumericChunkFiles(targetDirectory)
  if (numericFiles.length > 0) {
    const highest = numericFiles[numericFiles.length - 1]
    const highestPath = path.join(targetDirectory, highest.filename)
    const highestArray = readJsonArrayFile(highestPath) || []
    return { startIndex: highest.index, currentFill: highestArray.length }
  }
  if (manifestEntry && manifestEntry.lastFile) {
    const match = String(manifestEntry.lastFile).match(/^0*(\d+)\.json$/)
    if (match) {
      return { startIndex: Number(match[1]), currentFill: 0 }
    }
  }
  return { startIndex: 0, currentFill: 0 }
}

/* -----------------------
   Append into partial chunk if needed
   ----------------------- */
function appendToPartialChunkIfNeeded(targetDirectory, startIndex, currentFill, itemsToConsume, perChunkLimit) {
  let currentChunkIndex = startIndex
  let currentChunkFill = currentFill

  if (currentChunkFill > 0 && currentChunkFill < perChunkLimit && itemsToConsume.length > 0) {
    const spaceAvailable = perChunkLimit - currentChunkFill
    const itemsToAppend = itemsToConsume.splice(0, Math.min(spaceAvailable, itemsToConsume.length))
    const filename = `${zeroPadNumber(currentChunkIndex, PADDING_WIDTH)}.json`
    const chunkPath = path.join(targetDirectory, filename)
    appendItemsToJsonArrayFile(chunkPath, itemsToAppend)
    currentChunkFill += itemsToAppend.length
    console.log(`Appended ${itemsToAppend.length} items to ${path.relative(process.cwd(), chunkPath)} (now ${currentChunkFill}/${perChunkLimit})`)
    if (currentChunkFill >= perChunkLimit) {
      currentChunkIndex++
      currentChunkFill = 0
    }
  }

  return { currentIndex: currentChunkIndex, currentFill: currentChunkFill }
}

/* -----------------------
   Write new full and final partial chunks
   ----------------------- */
function writeChunksFromItems(targetDirectory, startingChunkIndex, itemsToWrite, perChunkLimit) {
  let chunkIndex = startingChunkIndex
  while (itemsToWrite.length > 0) {
    const take = Math.min(perChunkLimit, itemsToWrite.length)
    const chunkArray = itemsToWrite.splice(0, take)
    const filename = `${zeroPadNumber(chunkIndex, PADDING_WIDTH)}.json`
    const outPath = path.join(targetDirectory, filename)
    writeJsonArrayFile(outPath, chunkArray)
    console.log(`Wrote ${chunkArray.length} items to ${path.relative(process.cwd(), outPath)}`)
    chunkIndex++
  }
  return chunkIndex
}

/* -----------------------
   Compute post-run stats for a difficulty
   ----------------------- */
function computeChunkDirectoryStats(targetDirectory) {
  const numericFiles = listNumericChunkFiles(targetDirectory)
  if (numericFiles.length === 0) {
    return { chunks: 0, lastFile: null, totalPuzzles: 0 }
  }
  let totalCount = 0
  for (const fileDesc of numericFiles) {
    const arr = readJsonArrayFile(path.join(targetDirectory, fileDesc.filename)) || []
    totalCount += arr.length
  }
  const lastIndex = numericFiles[numericFiles.length - 1].index
  return { chunks: lastIndex + 1, lastFile: `${zeroPadNumber(lastIndex, PADDING_WIDTH)}.json`, totalPuzzles: totalCount }
}

/* -----------------------
   High-level processing for one source file
   ----------------------- */
function processSourceFile(sourceFilePath, outputRoot, existingManifest) {
  const rawArray = loadJsonArrayFromFile(sourceFilePath)
  if (rawArray === null) return null

  const validatedPuzzles = validateAndFilterPuzzles(rawArray, sourceFilePath)
  if (validatedPuzzles.length === 0) {
    const difficultyKey = path.basename(sourceFilePath, '.json').toLowerCase()
    console.log(`Skipping ${difficultyKey}.json — no valid puzzles found`)
    return {
      difficulty: difficultyKey,
      chunks: 0,
      chunkSize,
      lastFile: null,
      totalPuzzles: 0
    }
  }

  const difficultyKey = path.basename(sourceFilePath, '.json').toLowerCase()
  const difficultyOutputDir = outputRoot ? path.join(outputRoot, difficultyKey) : path.join(path.dirname(sourceFilePath), difficultyKey)
  ensureDirectoryExists(difficultyOutputDir)

  const manifestEntry = existingManifest && existingManifest[difficultyKey] ? existingManifest[difficultyKey] : null

  const { startIndex, currentFill } = determineStartChunkIndexAndFill(difficultyOutputDir, manifestEntry)

  // copy validated array to a mutable list of remaining items
  const remainingItems = validatedPuzzles.slice()

  // fill partial last chunk if it exists
  const afterPartial = appendToPartialChunkIfNeeded(difficultyOutputDir, startIndex, currentFill, remainingItems, chunkSize)
  const nextChunkIndex = afterPartial.currentIndex

  // write remaining items into new chunks
  writeChunksFromItems(difficultyOutputDir, nextChunkIndex, remainingItems, chunkSize)

  // compute final directory stats
  const finalStats = computeChunkDirectoryStats(difficultyOutputDir)

  return {
    difficulty: difficultyKey,
    chunks: finalStats.chunks,
    chunkSize,
    lastFile: finalStats.lastFile,
    totalPuzzles: finalStats.totalPuzzles
  }
}

/* -----------------------
   Main (moved here)
   ----------------------- */

async function main() {
  const runResults = {}

  // choose manifest path candidate
  let manifestPathCandidate = null
  if (outRoot) {
    ensureDirectoryExists(outRoot)
    manifestPathCandidate = path.join(outRoot, 'manifest.json')
  } else {
    if (fs.existsSync(inputArg) && fs.statSync(inputArg).isDirectory()) {
      manifestPathCandidate = path.join(inputArg, 'manifest.json')
    } else {
      manifestPathCandidate = path.join(path.dirname(inputArg), 'manifest.json')
    }
  }

  const existingManifest = fs.existsSync(manifestPathCandidate) ? readManifest(manifestPathCandidate) : {}

  if (fs.existsSync(inputArg) && fs.statSync(inputArg).isDirectory()) {
    const files = fs.readdirSync(inputArg).filter(isJsonFilename)
    if (!files.length) {
      console.error(`Error: no .json files found in directory ${inputArg}`)
      process.exit(1)
    }
    const targetRoot = outRoot || inputArg
    ensureDirectoryExists(targetRoot)

    // prefer manifest inside targetRoot if present
    const targetManifestPath = path.join(targetRoot, 'manifest.json')
    const baseManifest = fs.existsSync(targetManifestPath) ? readManifest(targetManifestPath) : existingManifest

    for (const fileName of files) {
      const filePath = path.join(inputArg, fileName)
      const result = processSourceFile(filePath, targetRoot, baseManifest)
      if (result) runResults[result.difficulty] = result
    }

    // merge runResults into manifest in targetRoot
    const mergedManifest = { ...(fs.existsSync(targetManifestPath) ? readManifest(targetManifestPath) : {}), ...runResults }
    writeManifestAtomically(targetManifestPath, mergedManifest)
    console.log(`Updated manifest ${path.relative(process.cwd(), targetManifestPath)}`)
  } else if (fs.existsSync(inputArg) && fs.statSync(inputArg).isFile()) {
    const inputDirectory = path.dirname(inputArg)
    const targetRoot = outRoot || inputDirectory
    ensureDirectoryExists(targetRoot)

    const targetManifestPath = path.join(targetRoot, 'manifest.json')
    const baseManifest = fs.existsSync(targetManifestPath) ? readManifest(targetManifestPath) : existingManifest

    const result = processSourceFile(inputArg, targetRoot, baseManifest)
    if (result) {
      const merged = { ...(fs.existsSync(targetManifestPath) ? readManifest(targetManifestPath) : {}), [result.difficulty]: result }
      writeManifestAtomically(targetManifestPath, merged)
      console.log(`Updated manifest ${path.relative(process.cwd(), targetManifestPath)}`)
    } else {
      console.log('No chunks created')
    }
  } else {
    console.error(`Error: input path not found: ${inputArg}`)
    process.exit(1)
  }

  console.log('Chunking run complete')
}

main()
