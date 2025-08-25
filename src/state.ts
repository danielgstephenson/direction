import { choose, range, shuffle, Vec2 } from './math'
import { gridSize, innerLocations, locations, unitCount } from './params'
import { move, Unit } from './unit'

export class State {
  token: string = ''
  units: Unit[] = []
  goals: Vec2[] = []
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
    reset(this)
  }
}

export function advance (state: State): void {
  const unit = state.units[state.rank]
  move(state, unit)
  state.round += 1
  state.rank = state.round % unitCount
  state.team = state.rank % 2
  state.score = getScore(state)
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
  let score = 0
  state.units.forEach(unit => {
    state.goals.forEach(goal => {
      if (unit.x === goal.x && unit.y === goal.y) {
        score += unit.team === 0 ? -1 : 1
      }
    })
  })
  return score
}

export function isOpen (state: State, x: number, y: number): boolean {
  const s = gridSize - 1
  const outside = x < 0 || y < 0 || x > s || y > s
  if (outside) return false
  const occupants = getOccupants(state, x, y)
  if (occupants.length > 0) return false
  return true
}

export function reset (state: State): void {
  const inner = shuffle(innerLocations)
  const goal0 = inner[0]
  const goal1 = {
    x: gridSize - 1 - goal0.x,
    y: gridSize - 1 - goal0.y
  }
  state.goals = [goal0, goal1]
  const options = shuffle(locations)
  range(unitCount).forEach(rank => {
    const unit = state.units[rank]
    unit.x = options[rank].x
    unit.y = options[rank].y
    unit.dir = choose([0, 1, 2, 3])
  })
  state.score = getScore(state)
}
