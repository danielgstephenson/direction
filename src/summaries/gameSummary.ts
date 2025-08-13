import { Game } from '../game'
import { UnitSummary } from './unitSummary'

export class GameSummary {
  team = 0
  token = ''
  countdown = 0
  maxCountdown = 80
  gridSize = 8
  units: UnitSummary[] = []

  constructor (team: number, game?: Game) {
    this.team = team
    if (game != null) {
      this.token = game.token
      this.gridSize = game.gridSize
      this.units = game.units.map(unit => new UnitSummary(team, unit))
    }
  }
}
