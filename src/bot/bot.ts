import { choose, range } from '../math'
import { directions, discount, maxRound } from '../params'
import { advance, getStateId, setup, State } from '../state'
import { Decision } from './decision'

export class Bot {
  decisions = new Map<string, Decision>()
  layers: Decision[][] = [[]]

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
  }

  printHead (): void {
    const head = this.layers.slice(0, 3).flatMap(x => x)
    const headIds = head.map(x => x.id)
    console.log('headIds', headIds)
  }

  direct (state: State): number {
    const id = getStateId(state)
    const decision = this.decisions.get(id)
    console.log(`round: ${state.round}`)
    if (decision == null) {
      this.printHead()
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
    if (maxLayer.length > 100000) return
    this.layers[depth] = []
    maxLayer.forEach(decision => {
      if (decision.score !== 0) return
      const oldState = new State()
      setup(oldState, decision.id)
      directions.forEach(dir => {
        const state = structuredClone(oldState)
        const unit = state.units[state.rank]
        unit.dir = dir
        advance(state)
        const child = this.addDecision(state, depth)
        decision.children[dir] = child
      })
    })
    const layer = this.layers[depth]
    console.log('layer', depth, layer.length)
  }
}
