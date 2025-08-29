import { State } from '../state'

export class Decision {
  id = ''
  depth: number
  team: number
  score: number
  value: number
  children: Decision[] = []
  choices = [0, 1, 2, 3]

  constructor (state: State, depth: number, id: string) {
    this.depth = depth
    this.team = state.team
    this.score = state.score
    this.value = state.score
    this.id = id
  }
}
