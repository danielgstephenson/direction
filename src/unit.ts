import { range } from './math'
import { gridSize, actionVecs } from './params'
import { getOccupants, isOpen, Layout } from './layout'

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

export function getObstacles (layout: Layout, unit: Unit): Unit[] {
  const v = actionVecs[unit.dir]
  const obstacles: Unit[] = []
  for (const dt of range(1, gridSize)) {
    const xt = unit.x + v.x * dt
    const yt = unit.y + v.y * dt
    const occupants = getOccupants(layout, xt, yt)
    if (occupants.length === 0) return obstacles
    obstacles.push(...occupants)
  }
  return obstacles
}

export function isBlocked (layout: Layout, unit: Unit): boolean {
  const v = actionVecs[unit.dir]
  for (const dt of range(1, gridSize)) {
    const xt = unit.x + v.x * dt
    const yt = unit.y + v.y * dt
    if (isOpen(layout, xt, yt)) {
      return false
    }
  }
  return true
}

export function move (layout: Layout, unit: Unit): void {
  if (isBlocked(layout, unit)) return
  const v = actionVecs[unit.dir]
  const obstacles = getObstacles(layout, unit)
  obstacles.forEach(obstacle => {
    obstacle.x += v.x
    obstacle.y += v.y
  })
  unit.x += v.x
  unit.y += v.y
}
