import { console } from 'inspector'
import { clamp, product, range } from './math'
import { gridVecs, actionVecs, unitCount } from './params'

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
  const options = range(gridVecs.length)
  let s = state
  return range(unitCount).map(_ => {
    const i = s % options.length
    s = (s - i) / options.length
    return options.splice(i, 1)[0]
  })
}

const optionCounts = range(unitCount).map(r => {
  return gridVecs.length - r
})
export const maxState = product(optionCounts)
const coefficients = range(unitCount).map(i => {
  return product(optionCounts.slice(0, i))
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
  const movers = [0]
  let oldLoc = locs[0]
  console.log('check', gridVecs[oldLoc])
  for (let step = 0; step < 6; step++) {
    const nextLoc = shift[oldLoc][action]
    if (nextLoc === oldLoc) break
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

// range(1).forEach(_ => {
//   console.log('')
//   const locs = shuffle(range(gridVecs.length)).slice(0, unitCount)
//   const vectors = locs.map(loc => gridVecs[loc])
//   console.log('vectors', vectors)
//   console.log('locs', locs)
//   const state = locsToState(locs)
//   console.log('state', state)
//   const action = sample(actionSpace)
//   console.log('action', action)
//   const outcome = getOutcome(state, action)
//   console.log('outcome', outcome)
//   const locs2 = stateToLocs(outcome)
//   console.log('locs', locs2)
//   const vectors2 = locs2.map(loc => gridVecs[loc])
//   console.log('vectors', vectors2)
//   console.log('')
// })

// const values = new Uint8Array(maxState)
// console.log('begin test', maxState)
// values.forEach((i, state) => {
//   const outcome = getOutcome(state, 0)
//   values[state] = outcome % 5
//   if (i % 10000 === 0) console.log((i / maxState).toFixed(4))
// })

// range(10).forEach(i => {
//   console.log('')
//   const locs = shuffle(range(gridVecs.length)).slice(0, unitCount)
//   console.log('locs', i, locs)
//   const state = locsToState(locs)
//   console.log('state', i, state)
//   const locs2 = stateToLocs(state)
//   console.log('locs', i, locs2)
// })
