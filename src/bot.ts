import { Game } from './game'
import { Region } from './region'
import { choose, range } from './math'
import { State } from './state'
import { moveVectors } from './params'

export class Bot {
  maxDepth = 6
  discount = 0.4
  game: Game

  constructor (game: Game) {
    this.game = game
    this.maxDepth = game.server.config.depth
  }

  getChoice (team: number, state: State): number {
    const options = range(4)
    const region = state.regions.find(region => {
      return region.units[region.moveRank].team === team
    })
    if (region == null) throw new Error('region == null')
    const values = options.map(choice => {
      return this.getValue(team, region, choice, this.maxDepth)
    })
    const maxValue = Math.max(...values)
    const maxValueOptions = options.filter((_, i) => values[i] === maxValue)
    if (maxValueOptions.length === 1) return maxValueOptions[0]
    const unit = region.units[region.moveRank]
    const toGoal = {
      x: region.goal.x - unit.x,
      y: region.goal.y - unit.y
    }
    const dots = maxValueOptions.map(i => {
      const xx = moveVectors[i].x * toGoal.x
      const yy = moveVectors[i].y * toGoal.y
      return xx + yy
    })
    const maxDot = Math.max(...dots)
    const bestOptions = maxValueOptions.filter((_, i) => dots[i] === maxDot)
    return choose(bestOptions)
  }

  getValue (team: number, inputRegion: Region, choice: number, depth: number): number {
    const runner = this.game.runner
    const region = structuredClone(inputRegion)
    const otherTeam = 1 - team
    const oldScore = region.scores[team] - region.scores[otherTeam]
    if (oldScore !== 0) return oldScore
    runner.advance(region, choice)
    const reward = region.scores[team] - region.scores[otherTeam]
    if (reward !== 0) return reward
    if (depth < 1) return reward
    const nextValues = range(4).map(nextChoice => {
      return this.getValue(team, region, nextChoice, depth - 1)
    })
    return this.discount * Math.min(...nextValues)
  }
}
