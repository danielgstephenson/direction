import { Game } from './game'

export class Tick {
  countdown = 0
  round = 0
  phase = 'choice'
  team = 0
  choice = 0
  token = ''

  constructor (game: Game, team: number) {
    this.countdown = game.countdown
    this.round = game.state.round
    this.phase = game.state.phase
    this.team = team
    this.choice = game.choices[team]
    this.token = game.token
  }
}
