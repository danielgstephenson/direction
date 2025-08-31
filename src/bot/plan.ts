import { choose } from '../math'
import { directions } from '../params'
import { advance, State } from '../state'

export class Plan {
  scores = new Map<string, number>()
  teams = new Map<string, number>()
  children = new Map<string, Set<string>>()
  values = new Map<string, number>()
}

export function explore (plan: Plan, state: State, depth: number): void {
  if (depth < 0) return
  plan.scores.set(state.id, state.score)
  plan.teams.set(state.id, state.team)
  if (Math.abs(state.score) === 1) {
    plan.values.set(state.id, state.score)
    return
  }
  const children = plan.children.get(state.id) ?? new Set<string>()
  plan.children.set(state.id, children)
  const dir = choose(directions)
  const next = advance(state, dir)
  children.add(next.id)
  const value = plan.values.get(state.id) ?? state.score
  plan.values.set(state.id, value)
}
