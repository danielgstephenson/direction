import { Game } from './game'
import { range, sample } from './math'
import { actionSpace, endInterval, goals, maxRound, moveInterval, teamInterval, unitCount } from './params'
import { getOutcome, stateToLocs } from './state'

export class Summary {
  token: string
  state: number
  directions: number[]
  action: number
  level: number
  qTurns: number
  countdown = teamInterval
  phase = 'team'
  full = false
  botTeam = -1
  round = 0

  constructor (game: Game, level: number) {
    this.level = level
    this.token = game.token
    this.state = game.bot.getStartingState(level)
    this.directions = range(6).map(i => sample(actionSpace))
    this.action = this.directions[0]
    this.round = 0
    this.qTurns = sample(range(4))
  }
}

export function advance (summary: Summary): void {
  const oldRank = summary.round % unitCount
  summary.directions[oldRank] = summary.action
  summary.state = getOutcome(summary.state, summary.action)
  summary.round += 1
  summary.phase = 'move'
  summary.countdown = moveInterval
  const newRank = summary.round % unitCount
  summary.action = summary.directions[newRank]
  checkEnd(summary)
}

export function checkEnd (summary: Summary): void {
  const scores = getScores(summary)
  const win = Math.max(...scores) === 2
  const outOfTime = summary.round > maxRound
  if (win || outOfTime) {
    summary.phase = 'end'
    summary.countdown = endInterval
  }
}

export function getScores (summary: Summary): number[] {
  const scores = [0, 0]
  stateToLocs(summary.state).forEach((unitLoc, i) => {
    const team = (summary.round + i) % 2
    goals.forEach(goal => {
      if (goal === unitLoc) scores[team] += 1
    })
  })
  return scores
}
