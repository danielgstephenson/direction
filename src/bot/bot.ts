import { choose, range, Vec2 } from '../math'
import { directions, discount, moveVectors } from '../params'
import { advance, State } from '../state'
import { Worker } from 'worker_threads'
import path from 'path'

export class Bot {
  finished = false
  scores = new Map<string, number>()
  teams = new Map<string, number>()
  children = new Map<string, string[]>()
  values = new Map<string, number>()
  state: State

  constructor (state: State, depth: number) {
    // console.time('explore')
    this.setup(state, depth)
    // console.timeEnd('explore')
    // console.log('this.scores.size', this.scores.size)
    // console.time('plan')
    this.plan(depth)
    // console.timeEnd('plan')
    this.state = state
  }

  // expore (state: State, depth: number): void {
  //   if (depth < 0) return
  //   this.scores.set(state.id, state.score)
  //   this.teams.set(state.id, state.team)
  //   const dir = choose(directions)
  //   const next = advance(state, dir)
  // }

  setup (state: State, depth: number): void {
    if (depth < 0) return
    this.scores.set(state.id, state.score)
    this.teams.set(state.id, state.team)
    const children: string[] = []
    for (const dir of directions) {
      const next = advance(state, dir)
      children[dir] = next.id
      if (this.scores.has(next.id)) return
      this.setup(next, depth - 1)
    }
    this.children.set(state.id, children)
  }

  plan (depth: number): void {
    range(depth).forEach(_ => {
      this.scores.forEach((score, id) => {
        if (score !== 0) this.values.set(id, score)
        const children = this.children.get(id) ?? []
        const childValues = children.map(childId => {
          return this.values.get(childId) ?? 0
        })
        const team0 = this.teams.get(id) === 0
        const nextValue = team0
          ? Math.min(...childValues)
          : Math.max(...childValues)
        this.values.set(id, discount * nextValue)
      })
    })
  }

  getWorker (): Worker {
    const workerPath = path.resolve(__dirname, './worker.js')
    const worker = new Worker(workerPath)
    worker.on('message', (message: string) => {
      console.log('Main thread received:', message)
    })
    worker.on('error', (error: ErrorEvent) => {
      console.error('Worker error:', error)
    })
    worker.postMessage('Hello from the main thread!')
    return worker
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
  const bot = new Bot(state, depth)
  return directions.map(dir => {
    const next = advance(state, dir)
    // const value = getValue(next, depth)
    const value = bot.values.get(next.id) ?? 0
    return value
  })
}

export function getChoice (state: State, depth: number): number {
  const values = getActionValues(state, depth)
  const bestValue = state.team === 0
    ? Math.min(...values)
    : Math.max(...values)
  const choices = directions.filter(dir => {
    return values[dir] === bestValue
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
  const maxDot = Math.max(...dots)
  const bestOptions = options.filter((_, i) => dots[i] === maxDot)
  if (bestOptions.length === 0) return choose(directions)
  return choose(bestOptions)
}
