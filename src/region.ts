import { Vec2 } from './math'
import { OldUnit } from './oldUnit'

export class Region {
  units: OldUnit[] = []
  goal: Vec2 = { x: 0, y: 0 }
  scores = [0, 0]
  moveRank = 0
}
