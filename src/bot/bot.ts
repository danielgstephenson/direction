import { choose, Vec2 } from '../math'
import { directions, discount, moveVectors } from '../params'
import { advance, State } from '../state'
import { Worker } from 'worker_threads'
import path from 'path'

export class Bot {
  worker: Worker
  finished = false

  constructor () {
    const workerPath = path.resolve(__dirname, './worker.js')
    this.worker = new Worker(workerPath)

    this.worker.on('message', (message: string) => {
      console.log('Main thread received:', message)
    })

    this.worker.on('error', (error: ErrorEvent) => {
      console.error('Worker error:', error)
    })

    this.worker.postMessage('Hello from the main thread!')
  }
}

export function getValue (state: State, depth: number): number {
  if (state.score !== 0 || depth < 1) return state.score
  const team0 = state.team === 0
  const targetScore = team0 ? -1 : 1
  const values: number[] = []
  for (const dir of directions) {
    const next = advance(state, dir)
    if (next.score === targetScore) {
      return discount * next.score
    }
    const nextValue = getValue(next, depth - 1)
    values.push(nextValue)
  }
  const nextValue = team0 ? Math.min(...values) : Math.max(...values)
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
  return chooseDir(state, choices)
}

export function getGoalDir (state: State): Vec2 {
  const unit = state.units[state.rank]
  const goalDistances = state.goals.map(goal => {
    const dx = goal.x - unit.x
    const dy = goal.y - unit.y
    if (dx === 0 && dy === 0) return Infinity
    return Math.abs(dx) + Math.abs(dy)
  })
  const minGoalDisance = Math.min(...goalDistances)
  const nearGoals = state.goals.filter((_, i) => {
    return goalDistances[i] === minGoalDisance
  })
  const nearGoal = choose(nearGoals)
  const goalDir = {
    x: nearGoal.x - unit.x,
    y: nearGoal.y - unit.y
  }
  return goalDir
}

export function chooseDir (state: State, options: number[]): number {
  if (options.length === 1) return options[0]
  const goalDir = getGoalDir(state)
  const vectors = options.map(i => moveVectors[i])
  const dots = vectors.map(v => v.x * goalDir.x + v.y * goalDir.y)
  const bestOptions = options.filter((_, i) => dots[i] > 0)
  if (bestOptions.length === 0) return choose(directions)
  return choose(bestOptions)
}
