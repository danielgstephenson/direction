import { console } from 'inspector'
import { clamp, product, range } from './math'
import { gridVecs, actionVecs, unitCount, gridLocs } from './params'

export const shift = gridVecs.map(oldVec => {
  return actionVecs.map((actionVec, i) => {
    const x = clamp(oldVec.x + actionVec.x, 0, 4)
    const y = clamp(oldVec.y + actionVec.y, 0, 4)
    return gridVecs.findIndex(gridVec => {
      return gridVec.x === x && gridVec.y === y
    })
  })
})

export function stateToLocs (state: number): number[] {
  const options = [...gridLocs]
  let s = state
  return range(unitCount).map(_ => {
    const i = s % options.length
    s = (s - i) / options.length
    return options.splice(i, 1)[0]
  })
}

export const locOptionCounts = range(unitCount).map(r => {
  return gridVecs.length - r
})
export const stateCount = product(locOptionCounts)
export const coefficients = range(unitCount).map(i => {
  return product(locOptionCounts.slice(0, i))
})
export function locsToState (locs: number[]): number {
  const options = range(gridVecs.length)
  let total = 0
  locs.forEach((loc, unitIndex) => {
    const optionIndex = options.findIndex(i => i === loc)
    options.splice(optionIndex, 1)
    total += optionIndex * coefficients[unitIndex]
  })
  return total
}

export function getOutcome (state: number, action: number): number {
  const locs = stateToLocs(state)
  let movers = [0]
  let oldLoc = locs[0]
  console.log('check', gridVecs[oldLoc])
  for (let step = 0; step < 6; step++) {
    const nextLoc = shift[oldLoc][action]
    if (nextLoc === oldLoc) {
      movers = []
      break
    }
    console.log('check', gridVecs[nextLoc])
    const obstacle = locs.findIndex(loc => loc === nextLoc)
    if (obstacle < 0) {
      break
    } else {
      console.log('obstacle', obstacle)
      movers.push(obstacle)
    }
    oldLoc = nextLoc
  }
  movers.forEach(mover => {
    const loc = locs[mover]
    locs[mover] = shift[loc][action]
  })
  const actorLoc = locs.shift()
  if (actorLoc == null) throw new Error('actorLoc == null')
  locs.push(actorLoc)
  return locsToState(locs)
}
