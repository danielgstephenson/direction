import { Vec2 } from './math'
import { Unit } from './unit'

export class State {
  token: string = String(Math.random())
  units: Unit[] = []
  teams: Unit[][] = [[], []]
  goal: Vec2 = { x: 0, y: 0 }
  scores: number[] = [0, 0]
  moveRank: number = 0
  round: number = 0
}
