import { Manifold } from './manifold'
import { CellSummary } from './summaries/cellSummary'

export class Cell {
  manifold: Manifold
  index: number
  m: number
  x: number
  y: number
  blocked = false

  constructor (manifold: Manifold, index: number, m: number, x: number, y: number) {
    this.manifold = manifold
    this.index = index
    this.m = m
    this.x = x
    this.y = y
  }

  summarize (): CellSummary {
    return new CellSummary(this)
  }
}
