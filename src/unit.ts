export class Unit {
  region: number
  team: number
  rank: number
  x: number
  y: number
  dir: number

  constructor (region: number, team: number, rank: number, x: number, y: number, dir: number) {
    this.region = region
    this.team = team
    this.rank = rank
    this.x = x
    this.y = y
    this.dir = dir
  }
}
