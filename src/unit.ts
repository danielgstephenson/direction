import { range } from './math'
import { gridSize, moveVectors } from './params'
import { getOccupants, isOpen, State } from './state'

export class Unit {
  team: number
  rank: number
  x = 0
  y = 0
  dir = 0

  constructor (team: number, rank: number) {
    this.team = team
    this.rank = rank
  }
}

export function getObstacles (state: State, unit: Unit): Unit[] {
  const v = moveVectors[unit.dir]
  const obstacles: Unit[] = []
  for (const dt of range(1, gridSize)) {
    const xt = unit.x + v.x * dt
    const yt = unit.y + v.y * dt
    const occupants = getOccupants(state, xt, yt)
    if (occupants.length === 0) return obstacles
    obstacles.push(...occupants)
  }
  return obstacles
}

export function isBlocked (state: State, unit: Unit): boolean {
  const v = moveVectors[unit.dir]
  for (const dt of range(1, gridSize)) {
    const xt = unit.x + v.x * dt
    const yt = unit.y + v.y * dt
    if (isOpen(state, xt, yt)) {
      return false
    }
  }
  return true
}

export function move (state: State, unit: Unit): void {
  if (isBlocked(state, unit)) return
  const v = moveVectors[unit.dir]
  const obstacles = getObstacles(state, unit)
  obstacles.forEach(obstacle => {
    obstacle.x += v.x
    obstacle.y += v.y
  })
  unit.x += v.x
  unit.y += v.y
}
