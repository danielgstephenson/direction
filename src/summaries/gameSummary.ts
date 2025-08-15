import { Game } from '../game'
import { Vec2 } from '../math'
import { UnitSummary } from './unitSummary'

export class GameSummary {
  team = 0
  token = ''
  countdown = 0
  directRank = 0
  scores = [0, 0]
  state = 'move'
  units: UnitSummary[] = []
  goals: Vec2[] = []

  constructor (team: number, game?: Game) {
    this.team = team
    if (game != null) {
      this.token = game.token
      this.units = game.units.map(unit => new UnitSummary(team, unit))
      this.goals = game.goals
      this.countdown = game.countdown
      this.directRank = game.directRank
      this.state = game.state
      this.scores = game.scores
    }
  }
}
