
// TODO: move to own utility (also make more generic as we'll have more masks in the future)
export const addDigit = (currentMask: number, candidate: number): number => {
  const mask = 1 << (candidate - 1)
  return currentMask | mask
}

export const removeItemFromMask = (candidate: number, currentMask: number): number => {
  const mask = 1 << (candidate - 1)
  if (hasDigit(currentMask, candidate)) {
    return currentMask ^ mask
  }
  return currentMask
};

export const hasDigit = (mask: number, digit: number): boolean => {
  const bitMask = digitToBitMask(digit)
  return (mask & bitMask) !== 0
}

// TODO: generic refactor:
// hasDigit(mask, digit)
// addDigit(mask, digit)
// removeDigit(mask, digit)
// toggleDigit(mask, digit) ?? maybe - not sure we need it

// TODO: for cleaner call sites
// export const isHighlighted = (highlightMask: number, digit: number) =>
//   hasDigit(highlightMask, digit)

// export const highlightDigit = (highlightMask: number, digit: number) =>
//   addDigit(highlightMask, digit)

// private
const digitToBitMask = (digit: number): number => 1 << (digit - 1)
