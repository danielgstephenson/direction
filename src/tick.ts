import { Game } from './game'

export class Tick {
  countdown = 0
  phase = 'choice'
  team = 0
  choice = 0
  moveRank = 0
  token = ''

  constructor (game: Game, team: number) {
    this.countdown = game.countdown
    this.phase = game.phase
    this.moveRank = game.state.moveRank
    this.team = team
    this.choice = game.choices[team]
    this.token = game.token
  }
}
