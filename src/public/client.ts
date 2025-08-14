import io from 'socket.io-client'
import { GameSummary } from '../summaries/gameSummary'
import { Renderer } from './renderer'
import { Input } from './input'

export class Client {
  socket = io()
  renderer = new Renderer(this)
  input = new Input(this)

  constructor () {
    this.socket.on('connected', () => {
      console.log('connected')
    })
    this.socket.on('setup', (game: GameSummary) => {
      console.log('setup')
      this.renderer.setup(game)
    })
    this.socket.on('update', (game: GameSummary) => {
      this.onUpdate(game)
    })
    this.socket.on('tick', (countdown: number, state: string) => {
      this.renderer.onTick(countdown, state)
    })
  }

  onUpdate (game: GameSummary): void {
    const newServer = !['', game.token].includes(this.renderer.game.token)
    if (newServer) location.reload()
    this.renderer.onUpdate(game)
    this.renderer.game = game
  }
}
