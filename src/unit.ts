export class Unit {
  team: number
  index: number
  m: number
  x: number
  y: number
  direction: number

  constructor (team: number, index: number, m: number, x: number, y: number, direction: number) {
    this.team = team
    this.index = index
    this.m = m
    this.x = x
    this.y = y
    this.direction = direction
  }
}
