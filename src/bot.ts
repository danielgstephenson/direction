import { readFileSync } from 'fs-extra'
import { range } from './math'

export class Bot {
  startingStates0: DataView
  startingStates1: DataView
  values: Uint8Array

  constructor () {
    this.startingStates0 = this.getDataView('startingStates0.bin')
    this.startingStates1 = this.getDataView('startingStates1.bin')
    this.values = readFileSync('values.bin')
    console.log('startingStates0')
    range(5).forEach(i => {
      const offset = i * Int32Array.BYTES_PER_ELEMENT
      const state = this.startingStates0.getInt32(offset, true)
      console.log(i, state)
    })
    console.log('values')
    range(5).forEach(i => {
      console.log(i, this.values[i])
    })
  }

  getDataView (filePath: string): DataView {
    try {
      const buffer = readFileSync(filePath)
      const arrayBuffer = buffer.buffer
      return new DataView(arrayBuffer)
    } catch (err) {
      console.error(`Error reading file ${filePath}`, err)
      throw new Error(`Error reading file ${filePath}`)
    }
  }
}
