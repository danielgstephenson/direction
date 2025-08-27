import { range, Vec2 } from './math'

export const gridSize = 5
export const unitCount = 6
export const updateInterval = 0.2
export const moveInterval = 0.5
export const choiceInterval = 4
export const endInterval = 10
export const maxRound = 40
export const moveVectors = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 }
]

export const locations: Vec2[] = range(gridSize).flatMap(x => {
  return range(gridSize).map(y => {
    return { x, y }
  })
})

export const innerLocations = locations.filter(v => {
  const innerX = v.x > 0 && v.x < gridSize - 1
  const innerY = v.y > 0 && v.y < gridSize - 1
  return innerX && innerY
})

export const outerLocations = locations.filter(v => {
  const innerX = v.x > 0 && v.x < gridSize - 1
  const innerY = v.y > 0 && v.y < gridSize - 1
  return !innerX || !innerY
})
