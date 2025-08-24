import { choose, range, shuffle, Vec2 } from './math'
import { gridSize, locations, unitCount } from './params'
import { Unit } from './unit'

export class State {
  token: string = ''
  units: Unit[] = []
  goals: Vec2[] = []
  phase = 0

  constructor () {
    this.token = String(Math.random())
    this.reset()
  }

  toJson (): string {
    const object = {
      token: this.token,
      units: this.units.map(unit => unit.toJson()),
      goals: this.goals,
      phase: this.phase
    }
    return JSON.stringify(object)
  }

  static fromJson (jsonString: string): State {
    const object = JSON.parse(jsonString)
    const state = new State()
    if (typeof object.token !== 'string') throw new Error('invalid token')
    state.token = object.token
    if (typeof object.phase !== 'number') throw new Error('invalid phase')
    state.phase = object.phase
    if (!Array.isArray(object.units)) throw new Error('invalid units')
    object.units.forEach((jsonString: any) => {
      if (typeof jsonString !== 'string') throw new Error('invalid jsonString')
      const unit = Unit.fromJson(state, jsonString)
      state.units[unit.rank] = unit
    })
    if (!Array.isArray(object.goals)) throw new Error('invalid goals')
    object.goals.forEach((v: any) => {
      if (typeof v.x !== 'number') throw new Error('invalid x')
      if (typeof v.y !== 'number') throw new Error('invalid y')
      const goal: Vec2 = { x: v.x, y: v.y }
      object.goals.push(goal)
    })
    return state
  }

  getScore (): number {
    let score = 0
    this.units.forEach(unit => {
      this.goals.forEach(goal => {
        if (unit.x === goal.x && unit.y === goal.y) {
          score += unit.team === 0 ? -1 : 1
        }
      })
    })
    return score
  }

  getOccupants (x: number, y: number): Unit[] {
    const occupants: Unit[] = []
    for (const unit of this.units) {
      if (unit.x === x && unit.y === y) {
        occupants.push(unit)
      }
    }
    return occupants
  }

  isOpen (x: number, y: number): boolean {
    const s = gridSize - 1
    const outside = x < 0 || y < 0 || x > s || y > s
    if (outside) return false
    const occupants = this.getOccupants(x, y)
    if (occupants.length > 0) return false
    return true
  }

  reset (): void {
    const m = gridSize - 1
    let inner: Vec2[] = []
    let outer: Vec2[] = []
    locations.forEach(v => {
      const innerX = v.x > 0 && v.x < m
      const innerY = v.y > 0 && v.y < m
      if (innerX && innerY) inner.push(v)
      else outer.push(v)
    })
    inner = shuffle(inner)
    outer = shuffle(outer)
    const goal0 = inner.pop() ?? { x: 0, y: 0 }
    const goal1 = inner.pop() ?? { x: 0, y: 0 }
    this.goals = [goal0, goal1]
    const options = shuffle([...inner, ...outer])
    this.units = []
    range(unitCount).forEach(rank => {
      const team = rank % 2
      const x = options[rank].x
      const y = options[rank].y
      const dir = choose([0, 1, 2, 3])
      this.units[rank] = new Unit(this, team, rank, x, y, dir)
    })
  }
}
