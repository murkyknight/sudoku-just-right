declare module 'qqwing' {
  class QQWing {
    setPuzzle(puzzle: number[]): void
    solve(): boolean
    getSolutionString(): string
  }
  
  const QQWingConstructor: new () => QQWing
  export default QQWingConstructor
}