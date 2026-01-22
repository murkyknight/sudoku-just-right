/**
 * A static array of each row index and its array of all associated cell indices within the row.
 * 
	0: [0, 1, 2, 3, 4, 5, 6, 7, 8]
	1: [9, 10, 11, 12, 13, 14, 15, 16, 17]
	2: [18, 19, 20, 21, 22, 23, 24, 25, 26]
	3: [27, 28, 29, 30, 31, 32, 33, 34, 35]
	4: [36, 37, 38, 39, 40, 41, 42, 43, 44]
	5: [45, 46, 47, 48, 49, 50, 51, 52, 53]
	6: [54, 55, 56, 57, 58, 59, 60, 61, 62]
	7: [63, 64, 65, 66, 67, 68, 69, 70, 71]
	8: [72, 73, 74, 75, 76, 77, 78, 79, 80]
 */
export const rows: number[][] = Array.from({ length: 9 }, (_, r) =>
  Array.from({ length: 9 }, (_, c) => r * 9 + c),
)

/**
 * A static array of each column index and its array of all associated cell indices within the column.
 * 
 *0: [0, 9, 18, 27, 36, 45, 54, 63, 72]
	1: [1, 10, 19, 28, 37, 46, 55, 64, 73]
	2: [2, 11, 20, 29, 38, 47, 56, 65, 74]
	3: [3, 12, 21, 30, 39, 48, 57, 66, 75]
	4: [4, 13, 22, 31, 40, 49, 58, 67, 76]
	5: [5, 14, 23, 32, 41, 50, 59, 68, 77]
	6: [6, 15, 24, 33, 42, 51, 60, 69, 78]
	7: [7, 16, 25, 34, 43, 52, 61, 70, 79]
	8: [8, 17, 26, 35, 44, 53, 62, 71, 80]
 */
export const cols: number[][] = Array.from({ length: 9 }, (_, c) =>
  Array.from({ length: 9 }, (_, r) => r * 9 + c),
)

/**
 * A static array of each box index and its array of all associated cell indices within the box.
 * 
 *0: [0, 1, 2, 9, 10, 11, 18, 19, 20]
	1: [3, 4, 5, 12, 13, 14, 21, 22, 23]
	2: [6, 7, 8, 15, 16, 17, 24, 25, 26]
	3: [27, 28, 29, 36, 37, 38, 45, 46, 47]
	4: [30, 31, 32, 39, 40, 41, 48, 49, 50]
	5: [33, 34, 35, 42, 43, 44, 51, 52, 53]
	6: [54, 55, 56, 63, 64, 65, 72, 73, 74]
	7: [57, 58, 59, 66, 67, 68, 75, 76, 77]
	8: [60, 61, 62, 69, 70, 71, 78, 79, 80]
 */
export const boxes: number[][] = Array.from({ length: 9 }, (_, b) => {
  const br = Math.floor(b / 3) * 3
  const bc = (b % 3) * 3
  return Array.from({ length: 9 }, (_, k) => {
    const r = br + Math.floor(k / 3)
    const c = bc + (k % 3)
    return r * 9 + c
  })
})

// For each cell, its row/col/box indices (0..8)

/**
 * The row of each cell relative to their index.
 *
 * [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2,
 * 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5,
 * 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 8]
 */
export const cellRow: number[] = Array.from({ length: 81 }, (_, i) => Math.floor(i / 9))

/**
 * The column of each cell relative to their index.
 *
 * [0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8,
 * 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8,
 * 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8]
 */
export const cellCol: number[] = Array.from({ length: 81 }, (_, i) => i % 9)

/**
 * The box of each cell relative to their index.
 *
 * [0, 0, 0, 1, 1, 1, 2, 2, 2, 0, 0, 0, 1, 1, 1, 2, 2, 2, 0, 0, 0, 1, 1, 1, 2, 2, 2,
 * 3, 3, 3, 4, 4, 4, 5, 5, 5, 3, 3, 3, 4, 4, 4, 5, 5, 5, 3, 3, 3, 4, 4, 4, 5, 5, 5,
 * 6, 6, 6, 7, 7, 7, 8, 8, 8, 6, 6, 6, 7, 7, 7, 8, 8, 8, 6, 6, 6, 7, 7, 7, 8, 8, 8]
 */
export const cellBox: number[] = Array.from({ length: 81 }, (_, i) => {
  const r = Math.floor(i / 9)
  const c = i % 9
  return Math.floor(r / 3) * 3 + Math.floor(c / 3)
})

/**
 * The peers array maps each Sudoku cell (0..80) to the list of other cell indices that share 
 * a constraint with it: same row, same column, or same 3×3 box. It’s a precomputed static index 
 * used to quickly find all cells that must not contain the same digit as a given cell.
 * NOTE: Peer list returned excludes index used to retive peer list

Why this is useful (practical uses):

- Constraint checking: When you place a digit in cell i, you only need to check the cells in peers[i] 
to ensure that digit doesn’t already appear there.
- Candidate elimination: When maintaining a set of possible candidates for each cell, placing or ruling 
out a digit in cell i means removing that candidate from every cell in peers[i].
- Propagation: Many solving strategies (naked/hidden singles, pointing pairs, more advanced techniques) 
require iterating over a cell’s peers to propagate constraints; precomputing peers avoids recalculating 
row/col/box membership repeatedly.
 */
export const peers: number[][] = Array.from({ length: 81 }, (_, i) => {
  const set = new Set<number>([...rows[cellRow[i]], ...cols[cellCol[i]], ...boxes[cellBox[i]]])
  set.delete(i)
  return [...set]
})

/**
 * Peer list that includes the given index used to retrieve the peer list.
 */
export const peersInclusive: number[][] = Array.from({ length: 81 }, (_, i) => {
  const set = new Set<number>([...rows[cellRow[i]], ...cols[cellCol[i]], ...boxes[cellBox[i]]])
  return [...set]
})
