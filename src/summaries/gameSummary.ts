import { Game } from '../game'
import { Vec2 } from '../math'
import { UnitSummary } from './unitSummary'

export class GameSummary {
  team = 0
  token = ''
  countdown = 0
  maxCountdown = 80
  mapSize = 8
  units: UnitSummary[] = []
  goals: Vec2[] = []

  constructor (team: number, game?: Game) {
    this.team = team
    if (game != null) {
      this.token = game.token
      this.mapSize = game.mapSize
      this.units = game.units.map(unit => new UnitSummary(team, unit))
      this.goals = game.goals
    }
  }
}
