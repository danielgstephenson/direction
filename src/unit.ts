import { Game } from './game'
import { range } from './math'
import { mapSize } from './params'

export class Unit {
  game: Game
  id: number
  team: number
  rank: number
  m: number
  x: number
  y: number
  dir: number
  newDir: number

  constructor (game: Game, team: number, rank: number, m: number, x: number, y: number, dir: number) {
    this.game = game
    this.id = game.units.length
    game.units[this.id] = this
    this.team = team
    this.rank = rank
    this.m = m
    this.x = x
    this.y = y
    this.dir = dir
    this.newDir = dir
  }

  move (): void {
    this.dir = this.newDir
    const angle = 0.5 * Math.PI * this.dir
    const dx = Math.round(Math.cos(angle))
    const dy = Math.round(Math.sin(angle))
    if (this.isBlocked(dx, dy)) {
      this.flip()
      return
    }
    const obstacles = this.getObstacles(dx, dy)
    obstacles.forEach(unit => {
      unit.x += dx
      unit.y += dy
    })
    this.x += dx
    this.y += dy
  }

  getOccupants (m: number, x: number, y: number): Unit[] {
    const occupants: Unit[] = []
    for (const unit of this.game.units) {
      if (unit.m === m && unit.x === x && unit.y === y) {
        occupants.push(unit)
      }
    }
    return occupants
  }

  isOpen (m: number, x: number, y: number): boolean {
    const s = mapSize - 1
    const outside = x < 0 || y < 0 || x > s || y > s
    if (outside) return false
    const occupants = this.getOccupants(m, x, y)
    if (occupants.length > 0) return false
    return true
  }

  isBlocked (dx: number, dy: number): boolean {
    for (const dt of range(1, mapSize)) {
      const xt = this.x + dx * dt
      const yt = this.y + dy * dt
      if (this.isOpen(this.m, xt, yt)) {
        return false
      }
    }
    return true
  }

  getObstacles (dx: number, dy: number): Unit[] {
    const obstacles: Unit[] = []
    for (const dt of range(1, mapSize)) {
      const xt = this.x + dx * dt
      const yt = this.y + dy * dt
      const occupants = this.getOccupants(this.m, xt, yt)
      if (occupants.length === 0) return obstacles
      obstacles.push(...occupants)
    }
    return obstacles
  }

  flip (): void {
    this.dir = (this.dir + 2) % 4
    this.newDir = this.dir
  }
}
