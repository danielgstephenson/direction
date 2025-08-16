import { Region } from './region'

export class State {
  token: string = String(Math.random())
  regions: Region[] = []
}
