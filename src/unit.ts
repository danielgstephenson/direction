import { range } from './math'
import { gridSize, moveVectors } from './params'
import { State } from './state'

export class Unit {
  state: State
  team: number
  rank: number
  x: number
  y: number
  dir: number

  constructor (state: State, team: number, rank: number, x: number, y: number, dir: number) {
    this.state = state
    this.team = team
    this.rank = rank
    this.x = x
    this.y = y
    this.dir = dir
  }

  toJson (): string {
    return JSON.stringify(this, (key, value) => {
      if (key === 'state') return undefined
      return value
    })
  }

  static fromJson (state: State, jsonString: string): Unit {
    const object = JSON.parse(jsonString)
    if (typeof object.team !== 'number') throw new Error('invalid team')
    if (typeof object.rank === 'number') throw new Error('invalid rank')
    if (typeof object.x === 'number') throw new Error('invalid x')
    if (typeof object.y === 'number') throw new Error('invalid y')
    if (typeof object.dir === 'number') throw new Error('invalid dir')
    return new Unit(state, object.team, object.rank, object.x, object.y, object.dir)
  }

  isBlocked (): boolean {
    const v = moveVectors[this.dir]
    for (const dt of range(1, gridSize)) {
      const xt = this.x + v.x * dt
      const yt = this.y + v.y * dt
      if (this.state.isOpen(xt, yt)) {
        return false
      }
    }
    return true
  }

  move (): void {
    if (this.isBlocked()) return
    const v = moveVectors[this.dir]
    const obstacles = this.getObstacles()
    obstacles.forEach(obstacle => {
      obstacle.x += v.x
      obstacle.y += v.y
    })
    this.x += v.x
    this.y += v.y
  }

  getObstacles (): Unit[] {
    const v = moveVectors[this.dir]
    const obstacles: Unit[] = []
    for (const dt of range(1, gridSize)) {
      const xt = this.x + v.x * dt
      const yt = this.y + v.y * dt
      const occupants = this.state.getOccupants(xt, yt)
      if (occupants.length === 0) return obstacles
      obstacles.push(...occupants)
    }
    return obstacles
  }
}
