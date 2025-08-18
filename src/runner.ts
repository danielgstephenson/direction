import { choose, range, shuffle, Vec2 } from './math'
import { gridSize, teamSize } from './params'
import { Region } from './region'
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

  onStep (state: State, choices: number[]): void {
    state.round += 1
    state.regions.forEach(region => {
      const unit = region.units[region.moveRank]
      this.advance(region, choices[unit.team])
    })
  }

  advance (region: Region, choice: number): void {
    const unit = region.units[region.moveRank]
    unit.dir = choice
    this.move(region, unit)
    region.scores = this.getScores(region)
    region.moveRank = (region.moveRank + 1) % teamSize
  }

  getObstacles (region: Region, unit: Unit): Unit[] {
    const v = this.getVelocity(unit)
    const obstacles: Unit[] = []
    for (const dt of range(1, gridSize)) {
      const xt = unit.x + v.x * dt
      const yt = unit.y + v.y * dt
      const occupants = this.getOccupants(region, xt, yt)
      if (occupants.length === 0) return obstacles
      obstacles.push(...occupants)
    }
    return obstacles
  }

  getOccupants (region: Region, x: number, y: number): Unit[] {
    const occupants: Unit[] = []
    for (const unit of region.units) {
      if (unit.x === x && unit.y === y) {
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

  getScores (region: Region): number[] {
    const scores = [0, 0]
    region.units.forEach(unit => {
      if (unit.x === region.goal.x && unit.y === region.goal.y) {
        if (unit.team === 0) scores[0] += 1
        if (unit.team === 1) scores[1] += 1
      }
    })
    return scores
  }

  isBlocked (region: Region, unit: Unit): boolean {
    const v = this.getVelocity(unit)
    for (const dt of range(1, gridSize)) {
      const xt = unit.x + v.x * dt
      const yt = unit.y + v.y * dt
      if (this.isOpen(region, xt, yt)) {
        return false
      }
    }
    return true
  }

  isOpen (region: Region, x: number, y: number): boolean {
    const s = gridSize - 1
    const outside = x < 0 || y < 0 || x > s || y > s
    if (outside) return false
    const occupants = this.getOccupants(region, x, y)
    if (occupants.length > 0) return false
    return true
  }

  move (region: Region, unit: Unit): void {
    if (this.isBlocked(region, unit)) return
    const v = this.getVelocity(unit)
    const obstacles = this.getObstacles(region, unit)
    obstacles.forEach(obstacle => {
      obstacle.x += v.x
      obstacle.y += v.y
    })
    unit.x += v.x
    unit.y += v.y
  }

  setup (state: State): void {
    state.regions = [new Region(), new Region()]
    const teamOffset = choose([0, 1])
    const locations = shuffle(this.locations)
    range(teamSize).forEach(rank => {
      const team0 = (rank + teamOffset) % 2
      const team1 = 1 - team0
      const x = locations[rank].x
      const y = locations[rank].y
      const dir = choose([0, 1, 2, 3])
      const unit0 = new Unit(0, team0, rank, x, y, dir)
      const unit1 = new Unit(1, team1, rank, x, y, dir)
      state.regions[0].units[rank] = unit0
      state.regions[1].units[rank] = unit1
    })
    const center = Math.floor(0.5 * gridSize)
    const goal = { x: center, y: center }
    state.regions[0].goal = goal
    state.regions[1].goal = goal
  }

  reset (state: State): void {
    const locations = shuffle(this.locations)
    state.round = 0
    state.regions.forEach(region => {
      region.moveRank = 0
      region.scores = [0, 0]
    })
    range(teamSize).forEach(rank => {
      const x = locations[rank].x
      const y = locations[rank].y
      const dir = choose([0, 1, 2, 3])
      state.regions[0].units[rank].x = x
      state.regions[1].units[rank].x = x
      state.regions[0].units[rank].y = y
      state.regions[1].units[rank].y = y
      state.regions[0].units[rank].dir = dir
      state.regions[1].units[rank].dir = dir
    })
  }
}
