declare module 'qqwing' {
  class QQWing {
    setPuzzle(puzzle: number[]): void
    solve(): boolean
    getSolutionString(): string
  }

  export default QQWing
}