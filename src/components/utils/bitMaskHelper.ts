

export const addDigit = (currentMask: number, candidate: number): number => {
  const mask = 1 << (candidate - 1)
  return currentMask | mask
}

export const removeDigit = (currentMask: number, candidate: number): number => {
  const mask = 1 << (candidate - 1)
  if (hasDigit(currentMask, candidate)) {
    return currentMask ^ mask
  }
  return currentMask
}

export const hasDigit = (mask: number, digit: number): boolean => {
  const bitMask = digitToBitMask(digit)
  return (mask & bitMask) !== 0
}

// TODO: for cleaner call sites - when we move to Zustard
// export const isHighlighted = (highlightMask: number, digit: number) =>
//   hasDigit(highlightMask, digit)

// export const highlightDigit = (highlightMask: number, digit: number) =>
//   addDigit(highlightMask, digit)

// private
const digitToBitMask = (digit: number): number => 1 << (digit - 1)
