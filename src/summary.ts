import { Game } from './game'
import { randInt, range, sample } from './math'
import { actionSpace, choiceInterval, endInterval, maxRound } from './params'
import { stateCount, stateToLocs } from './state'

export class Summary {
  token: string
  state: number
  goals: number[]
  directions: number[]
  countdown = choiceInterval
  choice = sample(actionSpace)
  phase = 'choice'
  round = 0

  constructor (game: Game) {
    this.token = game.token
    this.state = randInt(0, stateCount - 1)
    this.directions = range(6).map(i => sample(actionSpace))
    this.goals = [12, 17]
    this.round = 0
  }
}

export function checkEnd (summary: Summary): void {
  const scores = getScores(summary)
  const win = Math.max(...scores) === 2
  const outOfTime = summary.round > maxRound
  if (win || outOfTime) {
    console.log('final round', summary.round)
    summary.phase = 'end'
    summary.countdown = endInterval
  }
}

export function getScores (summary: Summary): number[] {
  const scores = [0, 0]
  stateToLocs(summary.state).forEach((unitLoc, i) => {
    const team = (summary.round + i) % 2
    summary.goals.forEach(goal => {
      if (goal === unitLoc) scores[team] += 1
    })
  })
  return scores
}
