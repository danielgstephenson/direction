import { Region } from './region'

export class OldState {
  token: string
  regions: Region[] = []
  phase = 'choice'
  round = 0

  constructor (token: string = '') {
    this.token = token
  }
}
