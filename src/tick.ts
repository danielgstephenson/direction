import { Game } from './game'

export class Tick {
  countdown: number
  round: number
  phase: string
  team: number
  choice: number
  rank: number
  score: number
  token: string

  constructor (game: Game, team: number) {
    this.team = team
    this.countdown = game.countdown
    this.phase = game.phase
    const state = game.state
    this.score = state.score
    this.round = state.round
    this.token = state.token
    this.rank = state.rank
    if (team === state.team) {
      this.choice = game.choice
    } else {
      this.choice = state.units[state.rank].dir
    }
  }
}
