import { Game } from '../game'
import { Unit } from '../unit'

export class GameSummary {
  team = 0
  token = ''
  countdown = 0
  maxCountdown = 80
  gridSize = 8
  units: Unit[] = []

  constructor (team: number, game?: Game) {
    this.team = team
    if (game != null) {
      this.token = game.token
      this.gridSize = game.gridSize
      this.units = game.units
    }
  }
}
