import { choose, range, shuffle, Vec2 } from './math'
import { gridSize, innerLocations, locations, unitCount } from './params'
import { move, Unit } from './unit'

export class State {
  token: string = ''
  id = ''
  units: Unit[] = []
  goals: Vec2[] = []
  history: string[] = []
  round = 0
  rank = 0
  team = 0
  score = 0

  constructor () {
    this.token = String(Math.random())
    range(unitCount).forEach(rank => {
      const team = rank % 2
      this.units[rank] = new Unit(team, rank)
    })
    range(2).forEach(i => {
      this.goals[i] = { x: 0, y: 0 }
    })
    resetState(this)
  }
}

export function advance (oldState: State, dir: number): State {
  const newState = structuredClone(oldState)
  const unit = newState.units[newState.rank]
  unit.dir = dir
  move(newState, unit)
  newState.round += 1
  newState.rank = newState.round % unitCount
  newState.team = newState.rank % 2
  newState.score = getScore(newState)
  newState.id = getStateId(newState)
  return newState
}

export function getOccupants (state: State, x: number, y: number): Unit[] {
  const occupants: Unit[] = []
  for (const unit of state.units) {
    if (unit.x === x && unit.y === y) {
      occupants.push(unit)
    }
  }
  return occupants
}

export function getScore (state: State): number {
  let goals = 0
  state.units.forEach(unit => {
    state.goals.forEach(goal => {
      if (unit.x === goal.x && unit.y === goal.y) {
        goals += unit.team === 0 ? -1 : 1
      }
    })
  })
  if (goals === -2) return -1
  if (goals === 2) return 1
  return 0
}

export function isOpen (state: State, x: number, y: number): boolean {
  const s = gridSize - 1
  const outside = x < 0 || y < 0 || x > s || y > s
  if (outside) return false
  const occupants = getOccupants(state, x, y)
  if (occupants.length > 0) return false
  return true
}

export function resetState (state: State): void {
  const inner = shuffle(innerLocations)
  range(2).forEach(i => {
    const goal = state.goals[i]
    goal.x = inner[i].x
    goal.y = inner[i].y
  })
  const options = shuffle(locations)
  range(unitCount).forEach(rank => {
    const unit = state.units[rank]
    unit.x = options[rank].x
    unit.y = options[rank].y
    unit.dir = choose([0, 1, 2, 3])
  })
  state.round = 0
  state.rank = 0
  state.team = 0
  state.score = getScore(state)
  state.id = getStateId(state)
}

export function getStateId (state: State): string {
  const numbers = [state.rank]
  state.units.forEach(unit => {
    numbers.push(unit.x, unit.y)
  })
  state.goals.forEach(goal => {
    numbers.push(goal.x, goal.y)
  })
  return JSON.stringify(numbers)
}

export function setup (state: State, id: string): void {
  const numbers = JSON.parse(id)
  if (!Array.isArray(numbers)) {
    throw new Error(`Invalid id: ${id}`)
  }
  state.rank = numbers.shift()
  state.round = state.rank
  state.units.forEach(unit => {
    unit.x = numbers.shift()
    unit.y = numbers.shift()
  })
  state.goals.forEach(goal => {
    goal.x = numbers.shift()
    goal.y = numbers.shift()
  })
  state.score = getScore(state)
}
