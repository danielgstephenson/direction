import { Region } from './region'

export class State {
  token: string
  regions: Region[] = []
  phase = 'choice'
  round = 0

  constructor (token: string = '') {
    this.token = token
  }
}
