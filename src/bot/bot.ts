import { choose, mean } from '../math'
import { directions, discount } from '../params'
import { advance, State } from '../state'

export class Bot {
  finished = false
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
  const nextValue = team0
    ? Math.min(...values) + 0.001 * meanValue
    : Math.max(...values) + 0.001 * meanValue
  return discount * nextValue
}

export function getActionValues (state: State, depth: number): number[] {
  return directions.map(dir => {
    const next = advance(state, dir)
    const value = getValue(next, depth)
    return value
  })
}

export function getChoice (state: State, depth: number): number {
  const values = getActionValues(state, depth)
  const optimalValue = state.team === 0
    ? Math.min(...values)
    : Math.max(...values)
  const choices = directions.filter(dir => {
    return values[dir] === optimalValue
  })
  return choose(choices)
}
