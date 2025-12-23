import { Game } from './game'
import { range, sample } from './math'
import { actionSpace, choiceInterval, endInterval, goals, maxRound, moveInterval, teamInterval, unitCount } from './params'
import { getOutcome, stateToLocs } from './state'

export class Summary {
  token: string
  state: number
  history: number[] = []
  directions: number[]
  action: number
  level: number
  qTurns: number
  phase: string
  countdown: number
  full = false
  versus = false
  botTeam = -1
  round = 0

  constructor (game: Game, level: number) {
    this.level = level
    this.token = game.token
    this.versus = game.versus
    this.phase = 'team'
    this.countdown = game.versus ? teamInterval : choiceInterval
    const advantage = sample([0, 1])
    this.state = game.bot.getStartingState(level, advantage)
    this.directions = range(6).map(i => sample(actionSpace))
    this.action = this.directions[0]
    this.round = 0
    this.qTurns = sample(range(4))
  }
}

export function advance (summary: Summary): void {
  const oldRank = summary.round % unitCount
  summary.directions[oldRank] = summary.action
  summary.history.push(summary.state)
  summary.state = getOutcome(summary.state, summary.action)
  summary.round += 1
  summary.phase = 'move'
  summary.countdown = moveInterval
  const newRank = summary.round % unitCount
  summary.action = summary.directions[newRank]
  checkEnd(summary)
}

export function undo (summary: Summary): void {
  if (summary.history.length < 2) return
  if (summary.round < 2) return
  if (!['end', 'choice'].includes(summary.phase)) return
  summary.history.pop()
  const oldState = summary.history.pop()
  if (oldState == null) return
  summary.state = oldState
  summary.round = summary.round - 2
  summary.phase = 'choice'
  summary.countdown = choiceInterval
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
