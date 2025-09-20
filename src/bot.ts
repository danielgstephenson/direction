import { readFileSync } from 'fs-extra'
import { range, sample } from './math'
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
    console.log('startingStates0', this.startingStates0.buffer.byteLength / 4)
    range(5).forEach(i => {
      const offset = i * 4 // 4 bytes for an int32
      const state = this.startingStates0.getInt32(offset, true)
      console.log(i, state)
    })
    console.log('startingStates1', this.startingStates1.buffer.byteLength / 4)
    range(5).forEach(i => {
      const offset = i * 4 // 4 bytes for an int32
      const state = this.startingStates1.getInt32(offset, true)
      console.log(i, state)
    })
    console.log('values', this.values.byteLength)
    range(5).forEach(i => {
      console.log(i, this.values[i])
    })
  }

  getAction (state: number): number {
    const outcomes = actionSpace.map(action => getOutcome(state, action))
    const values = outcomes.map(outcome => 200 - this.values[outcome])
    const maxValue = Math.max(...values)
    const options = actionSpace.filter(a => values[a] === maxValue)
    return sample(options)
  }

  getStartingState (): number {
    const state0 = this.sampleInt32View(this.startingStates0)
    const state1 = this.sampleInt32View(this.startingStates1)
    return sample([state0, state1])
  }

  sampleInt32View (dataView: DataView): number {
    const count = dataView.buffer.byteLength / 4
    const index = Math.floor(Math.random() * count)
    const offset = index * 4
    const state = dataView.getInt32(offset, true)
    return state
  }

  getDataView (filePath: string): DataView {
    const buffer = readFileSync(filePath)
    const arrayBuffer = buffer.buffer
    return new DataView(arrayBuffer)
  }
}
