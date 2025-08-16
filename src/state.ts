import { Region } from './region'

export class State {
  token: string
  regions: Region[] = []

  constructor (token: string = '') {
    this.token = token
  }
}
