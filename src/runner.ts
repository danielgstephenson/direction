import { choose, range, shuffle, Vec2 } from './math'
import { gridSize, teamSize } from './params'
import { State } from './state'
import { Unit } from './unit'

export class Runner {
  locations: Vec2[] = []

  constructor () {
    range(gridSize).forEach(x => {
      range(gridSize).forEach(y => {
        this.locations.push({ x, y })
      })
    })
  }

  advance (state: State): void {
    const unit0 = state.teams[0][state.moveRank]
    const unit1 = state.teams[1][state.moveRank]
    this.move(state, unit0)
    this.move(state, unit1)
    state.scores = this.getScores(state)
    state.moveRank = (state.moveRank + 1) % teamSize
    state.round += 1
  }

  getObstacles (state: State, unit: Unit): Unit[] {
    const v = this.getVelocity(unit)
    const obstacles: Unit[] = []
    for (const dt of range(1, gridSize)) {
      const xt = unit.x + v.x * dt
      const yt = unit.y + v.y * dt
      const occupants = this.getOccupants(state, unit.grid, xt, yt)
      if (occupants.length === 0) return obstacles
      obstacles.push(...occupants)
    }
    return obstacles
  }

  getOccupants (state: State, grid: number, x: number, y: number): Unit[] {
    const occupants: Unit[] = []
    for (const unit of state.units) {
      if (unit.grid === grid && unit.x === x && unit.y === y) {
        occupants.push(unit)
      }
    }
    return occupants
  }

  getVelocity (unit: Unit): Vec2 {
    const angle = 0.5 * Math.PI * unit.dir
    const dx = Math.round(Math.cos(angle))
    const dy = Math.round(Math.sin(angle))
    return { x: dx, y: dy }
  }

  getScores (state: State): number[] {
    const scores = [0, 0]
    state.units.forEach(unit => {
      if (unit.x === state.goal.x && unit.y === state.goal.y) {
        if (unit.team === 0) scores[0] += 1
        if (unit.team === 1) scores[1] += 1
      }
    })
    return scores
  }

  isBlocked (state: State, unit: Unit): boolean {
    const v = this.getVelocity(unit)
    for (const dt of range(1, gridSize)) {
      const xt = unit.x + v.x * dt
      const yt = unit.y + v.y * dt
      if (this.isOpen(state, unit.grid, xt, yt)) {
        return false
      }
    }
    return true
  }

  isOpen (state: State, grid: number, x: number, y: number): boolean {
    const s = gridSize - 1
    const outside = x < 0 || y < 0 || x > s || y > s
    if (outside) return false
    const occupants = this.getOccupants(state, grid, x, y)
    if (occupants.length > 0) return false
    return true
  }

  move (state: State, unit: Unit): void {
    if (this.isBlocked(state, unit)) return
    const v = this.getVelocity(unit)
    const obstacles = this.getObstacles(state, unit)
    obstacles.forEach(obstacle => {
      obstacle.x += v.x
      obstacle.y += v.y
    })
    unit.x += v.x
    unit.y += v.y
  }

  setup (state: State): void {
    state.units = []
    const teamOffset = choose([0, 1])
    const locations = shuffle(this.locations)
    range(teamSize).forEach(rank => {
      const team0 = (rank + teamOffset) % 2
      const team1 = 1 - team0
      const x = locations[rank].x
      const y = locations[rank].y
      const dir = choose([0, 1, 2, 3])
      const id0 = state.units.length
      const id1 = id0 + 1
      const unit0 = new Unit(0, team0, rank, id0, x, y, dir)
      const unit1 = new Unit(1, team1, rank, id1, x, y, dir)
      state.units[id0] = unit0
      state.units[id1] = unit1
      state.teams[team0][rank] = unit0
      state.teams[team1][rank] = unit1
    })
    const center = Math.floor(0.5 * gridSize)
    state.goal = { x: center, y: center }
  }
}
