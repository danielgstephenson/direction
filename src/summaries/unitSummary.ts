import { Unit } from '../unit'

export class UnitSummary {
  team: number
  rank: number
  id: number
  m: number
  x: number
  y: number
  dir: number

  constructor (team: number, unit: Unit) {
    this.id = unit.id
    this.team = unit.team
    this.rank = unit.rank
    this.m = unit.m
    this.x = unit.x
    this.y = unit.y
    this.dir = team === unit.team ? unit.newDir : unit.dir
  }
}
