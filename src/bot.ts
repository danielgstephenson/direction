import { readFileSync } from 'fs-extra'
import { mean, sample } from './math'
import { getOutcome, stateToLocs } from './state'
import { actionSpace, goals, gridVecs } from './params'

export class Bot {
  startingStates0: DataView
  startingStates1: DataView
  values: Uint8Array

  constructor () {
    this.startingStates0 = this.getDataView('startingStates0.bin')
    this.startingStates1 = this.getDataView('startingStates1.bin')
    this.values = readFileSync('values.bin')
  }

  getAction (state: number): number {
    const outcomes = actionSpace.map(action => getOutcome(state, action))
    const actionValues = outcomes.map(outcome => {
      const netDistance = this.getNetDistance(outcome)
      return 200 - this.values[outcome] + 0.0001 * netDistance
    })
    const maxActionValue = Math.max(...actionValues)
    const options = actionSpace.filter(a => actionValues[a] === maxActionValue)
    return sample(options)
  }

  getNetDistance (state: number): number {
    const locs = stateToLocs(state)
    const vecs = locs.map(loc => gridVecs[loc])
    const dist = vecs.map(vec => {
      const goalDistances = goals.map(goalIndex => {
        const goalVec = gridVecs[goalIndex]
        const dx = vec.x - goalVec.x
        const dy = vec.y - goalVec.y
        return Math.sqrt(dx * dx + dy * dy)
      })
      return Math.min(...goalDistances)
    })
    const dist0 = [dist[0], dist[2], dist[4]]
    const dist1 = [dist[1], dist[3], dist[5]]
    return mean(dist0) - mean(dist1)
  }

  getStartingState (level: number): number {
    const sampleSize = 10000
    const startIndex = (level - 1) * sampleSize
    const index0 = startIndex + Math.floor(Math.random() * sampleSize)
    const index1 = startIndex + Math.floor(Math.random() * sampleSize)
    const state0 = this.startingStates0.getInt32(index0 * 4, true)
    const state1 = this.startingStates1.getInt32(index1 * 4, true)
    const startingState = sample([state0, state1])
    return startingState
  }

  readInt32 (dataView: DataView, index: number): number {
    const state = dataView.getInt32(index * 4, true)
    return state
  }

  getDataView (filePath: string): DataView {
    const buffer = readFileSync(filePath)
    const arrayBuffer = buffer.buffer
    return new DataView(arrayBuffer)
  }
}
