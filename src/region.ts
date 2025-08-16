import { Vec2 } from './math'
import { Unit } from './unit'

export class Region {
  units: Unit[] = []
  goal: Vec2 = { x: 0, y: 0 }
  scores = [0, 0]
  moveRank = 0
}
