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
    const layout = game.layout
    this.score = layout.score
    this.round = layout.round
    this.token = layout.token
    this.rank = layout.rank
    this.choice = game.choice
  }
}
