import { Cell } from './cell'
import { range } from './math'
import { ManifoldSummary } from './summaries/manifoldSummary'

export class Manifold {
  size = 8
  cells: Cell[] = []
  grid: Cell[][][] = range(2).map(_ => range(this.size).map(_ => []))
  summary: ManifoldSummary

  constructor () {
    this.buildCells()
    this.summary = this.summarize()
  }

  onStep (): void {
    this.summary = this.summarize()
  }

  buildCells (): void {
    range(2).forEach(m => {
      range(this.size).forEach(x => {
        range(this.size).forEach(y => {
          const index = this.cells.length
          const cell = new Cell(this, index, m, x, y)
          this.cells[index] = cell
          this.grid[m][x][y] = cell
        })
      })
    })
    this.summary = this.summarize()
  }

  summarize (): ManifoldSummary {
    return new ManifoldSummary(this)
  }
}
