import { readFileSync } from 'fs-extra'
import { sample } from './math'
import { getOutcome } from './state'
import { actionSpace } from './params'

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
    const values = outcomes.map(outcome => 200 - this.values[outcome])
    const maxValue = Math.max(...values)
    const options = actionSpace.filter(a => values[a] === maxValue)
    return sample(options)
  }

  getStartingState (level: number): number {
    const sampleSize = 10000
    const startIndex = (level - 1) * sampleSize
    const index0 = startIndex + Math.floor(Math.random() * sampleSize)
    const index1 = startIndex + Math.floor(Math.random() * sampleSize)
    const state0 = this.startingStates0.getInt32(index0 * 4, true)
    const state1 = this.startingStates1.getInt32(index1 * 4, true)
    const startingState = sample([state0, state1])
    console.log('value', this.values[startingState])
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
