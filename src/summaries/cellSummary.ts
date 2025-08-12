import { Cell } from '../cell'

export class CellSummary {
  index: number
  x: number
  y: number
  blocked: boolean

  constructor (cell: Cell) {
    this.index = cell.index
    this.x = cell.x
    this.y = cell.y
    this.blocked = cell.blocked
  }
}
