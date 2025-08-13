import { Game } from './game'

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
    const angle = 0.5 * Math.PI * this.dir
    const dx = Math.round(Math.cos(angle))
    const dy = Math.round(Math.sin(angle))
    const x2 = this.x + dx
    const y2 = this.y + dy
    const s = this.game.gridSize - 1
    const blocked = x2 < 0 || y2 < 0 || x2 > s || y2 > s
    if (blocked) {
      this.newDir = (this.dir + 2) % 4
      this.dir = this.newDir
      return
    }
    this.x = x2
    this.y = y2
  }
}
