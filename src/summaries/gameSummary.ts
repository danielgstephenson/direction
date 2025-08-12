import { Game } from '../game'

export class GameSummary {
  team = 0
  token = ''
  countdown = 0
  maxCountdown = 80

  constructor (team: number, game?: Game) {
    this.team = team
    if (game != null) {
      this.token = game.token
    }
  }
}
