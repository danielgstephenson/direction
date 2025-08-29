import { choose, mean, range } from '../math'
import { directions, discount, maxRound } from '../params'
import { advance, getStateId, setup, State } from '../state'
import { Decision } from './decision'

export class Bot {
  decisions = new Map<string, Decision>()
  layers: Decision[][] = [[]]
  finished = false

  constructor (state: State) {
    this.addDecision(state, 0)
    range(maxRound).forEach(_ => {
      this.addLayer()
    })
    range(this.layers.length).forEach(i => {
      this.plan()
      console.log('plan', i)
    })
    const value = this.layers[0][0].value
    const absValue = Math.abs(value)
    const rounds = Math.round(Math.log(absValue) / Math.log(discount))
    const sign = Math.sign(value)
    console.log('value', value, sign, rounds)
    this.printHead()
    console.log('decisionCount', this.decisions.size)
    this.finished = true
  }

  printHead (): void {
    console.log('headIds', this.layers[0][0].id)
  }

  direct (state: State): number {
    const id = getStateId(state)
    const decision = this.decisions.get(id)
    if (decision == null) {
      const lastId = state.history.at(-1)
      if (lastId == null) {
        throw new Error('missing lastId')
      }
      const lastDecision = this.decisions.get(lastId)
      if (lastDecision == null) {
        throw new Error(`missing lastDecision ${lastId}`)
      }
      const childIds = lastDecision.children.map(child => child.id)
      console.log(`children of ${lastId}:`, childIds)
      throw new Error(`missing decision: ${id}`)
    }
    return choose(decision.choices)
  }

  plan (): void {
    this.decisions.values().forEach(decision => {
      if (decision.score !== 0) {
        decision.value = decision.score
        return
      }
      if (decision.children.length === 0) return
      const values = decision.children.map(child => child.value)
      const nextValue = decision.team === 0
        ? Math.min(...values)
        : Math.max(...values)
      decision.value = discount * nextValue
      decision.choices = directions.filter(i => {
        return values[i] === nextValue
      })
    })
  }

  addDecision (state: State, depth: number): Decision {
    if (this.finished) {
      throw new Error('this.finished === true')
    }
    const id = getStateId(state)
    const old = this.decisions.get(id)
    if (old != null) return old
    const decision = new Decision(state, depth, id)
    this.decisions.set(id, decision)
    this.layers[depth].push(decision)
    return decision
  }

  addLayer (): void {
    const depth = this.layers.length
    const maxLayer = this.layers[depth - 1]
    if (maxLayer.length === 0) return
    if (maxLayer.length > 1000) return
    this.layers[depth] = []
    maxLayer.forEach(decision => {
      if (decision.score !== 0) return
      const oldState = new State()
      setup(oldState, decision.id)
      directions.forEach(dir => {
        const state = advance(oldState, dir)
        const child = this.addDecision(state, depth)
        decision.children[dir] = child
      })
    })
    const layer = this.layers[depth]
    console.log('layer', depth, layer.length)
  }
}

export function getValue (state: State, depth: number): number {
  if (state.score !== 0 || depth < 1) return state.score
  const team0 = state.team === 0
  const targetScore = team0 ? -1 : 1
  const values: number[] = []
  for (const dir of directions) {
    const next = advance(state, dir)
    const value = getValue(next, depth - 1)
    if (next.score === targetScore) return value
    values.push(value)
  }
  const meanValue = mean(values)
  return team0
    ? Math.min(...values) + 0.001 * meanValue
    : Math.max(...values) + 0.001 * meanValue
}

export function getChoice (state: State, depth: number): number {
  const values = directions.map(dir => {
    const next = advance(state, dir)
    const value = getValue(next, depth)
    return value
  })
  const optimalValue = state.team === 0
    ? Math.min(...values)
    : Math.max(...values)
  const choices = directions.filter(dir => {
    return values[dir] === optimalValue
  })
  return choose(choices)
}
