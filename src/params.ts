import { range, rotate, Vec2 } from './math'

export const gridSize = 5
export const unitCount = 6
export const tickInterval = 0.1
export const moveInterval = 0.75
export const choiceInterval = 15
export const endInterval = 6
export const teamInterval = 2
export const maxRound = 72
export const discount = 0.8

export const actionVecs = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 }
]

export const actionSpace = [0, 1, 2, 3]

export const origin = { x: 2, y: 2 }

export const gridVecs: Vec2[] = range(gridSize).flatMap(x => {
  return range(gridSize).map(y => {
    return { x, y }
  })
})

export const gridCount = gridVecs.length
export const gridLocs = range(gridCount)
export const goals = [12, 13]

export const innerLocs = gridLocs.filter(loc => {
  const v = gridVecs[loc]
  const innerX = v.x > 0 && v.x < gridSize - 1
  const innerY = v.y > 0 && v.y < gridSize - 1
  return innerX && innerY
})

export const innerGridVecs = gridVecs.filter(v => {
  const innerX = v.x > 0 && v.x < gridSize - 1
  const innerY = v.y > 0 && v.y < gridSize - 1
  return innerX && innerY
})

export const outerGridVecs = gridVecs.filter(v => {
  const innerX = v.x > 0 && v.x < gridSize - 1
  const innerY = v.y > 0 && v.y < gridSize - 1
  return !innerX || !innerY
})

export function getPosition (loc: number, qTurns: number): Vec2 {
  const gridVec = gridVecs[loc]
  return rotate(gridVec, origin, qTurns)
}
