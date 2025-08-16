export class Unit {
  grid: number
  team: number
  rank: number
  id: number
  x: number
  y: number
  dir: number

  constructor (grid: number, team: number, rank: number, id: number, x: number, y: number, dir: number) {
    this.grid = grid
    this.team = team
    this.rank = rank
    this.id = id
    this.x = x
    this.y = y
    this.dir = dir
  }
}
