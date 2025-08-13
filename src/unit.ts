import { Game } from './game'

export class Unit {
  id: number
  team: number
  rank: number
  m: number
  x: number
  y: number
  dir: number
  newDir: number

  constructor (game: Game, team: number, rank: number, m: number, x: number, y: number, dir: number) {
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
    const dx = Math.sign(Math.cos(angle))
    const dy = Math.sign(Math.sin(angle))
    this.x += dx
    this.y += dy
  }
}
