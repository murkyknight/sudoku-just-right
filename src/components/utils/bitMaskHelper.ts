
// TODO: move to own utility (also make more generic as we'll have more masks in the future)
export const addBitToMask = (candidate: number, currentMask: number): number => {
  const mask = 1 << (candidate - 1);
  return currentMask | mask;
};

export const removeItemFromMask = (candidate: number, currentMask: number): number => {
  const mask = 1 << (candidate - 1)
  if (hasDigit(candidate, currentMask)) {
    return currentMask ^ mask
  }
  return currentMask
};

// TODO: swap digit and mask params
// because the mask is the thing we'requerying. “Does this mask contain this digit?”
export const hasDigit = (digit: number, mask: number): boolean => {
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
