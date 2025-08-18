import { Region } from './region'

export class State {
  token: string
  regions: Region[] = []
  round = 0

  constructor (token: string = '') {
    this.token = token
  }
}
