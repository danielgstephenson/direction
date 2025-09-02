import { sample, range, shuffle, Vec2 } from './math'
import { gridSize, innerGridVecs, gridVecs, unitCount } from './params'
import { move, Unit } from './unit'

export class Layout {
  token: string = ''
  id = ''
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
    const options = shuffle(gridVecs)
    range(unitCount).forEach(rank => {
      const unit = this.units[rank]
      unit.x = options[rank].x
      unit.y = options[rank].y
      unit.dir = sample([0, 1, 2, 3])
    })
    const inner = shuffle(innerGridVecs)
    range(2).forEach(i => {
      this.goals[i] = {
        x: inner[i].x,
        y: inner[i].y
      }
    })
    this.round = 0
    this.rank = 0
    this.team = 0
    this.score = getScore(this)
    this.id = getLayoutId(this)
  }
}

export function advance (oldLayout: Layout, dir: number): Layout {
  const newLayout = structuredClone(oldLayout)
  const unit = newLayout.units[newLayout.rank]
  unit.dir = dir
  move(newLayout, unit)
  newLayout.round += 1
  newLayout.rank = newLayout.round % unitCount
  newLayout.team = newLayout.rank % 2
  newLayout.score = getScore(newLayout)
  newLayout.id = getLayoutId(newLayout)
  return newLayout
}

export function getOccupants (layout: Layout, x: number, y: number): Unit[] {
  const occupants: Unit[] = []
  for (const unit of layout.units) {
    if (unit.x === x && unit.y === y) {
      occupants.push(unit)
    }
  }
  return occupants
}

export function getScore (layout: Layout): number {
  let goals = 0
  layout.units.forEach(unit => {
    layout.goals.forEach(goal => {
      if (unit.x === goal.x && unit.y === goal.y) {
        goals += unit.team === 0 ? -1 : 1
      }
    })
  })
  if (goals === -2) return -1
  if (goals === 2) return 1
  return 0
}

export function isOpen (layout: Layout, x: number, y: number): boolean {
  const s = gridSize - 1
  const outside = x < 0 || y < 0 || x > s || y > s
  if (outside) return false
  const occupants = getOccupants(layout, x, y)
  if (occupants.length > 0) return false
  return true
}

export function getLayoutId (layout: Layout): string {
  const numbers = [layout.rank]
  layout.units.forEach(unit => {
    numbers.push(unit.x, unit.y)
  })
  layout.goals.forEach(goal => {
    numbers.push(goal.x, goal.y)
  })
  return JSON.stringify(numbers)
}

export function layoutFromId (id: string): Layout {
  const layout = new Layout()
  const numbers = JSON.parse(id)
  if (!Array.isArray(numbers)) {
    throw new Error(`Invalid id: ${id}`)
  }
  layout.rank = numbers.shift()
  layout.round = layout.rank
  layout.units.forEach(unit => {
    unit.x = numbers.shift()
    unit.y = numbers.shift()
  })
  layout.goals.forEach(goal => {
    goal.x = numbers.shift()
    goal.y = numbers.shift()
  })
  layout.score = getScore(layout)
  return layout
}
