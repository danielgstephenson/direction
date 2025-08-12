import io from 'socket.io-client'
import { GameSummary } from '../summaries/gameSummary'
import { Renderer } from './renderer'

export class Client {
  socket = io()
  renderer = new Renderer(this)

  constructor () {
    document.oncontextmenu = () => false
    document.onmousedown = (event) => {
      console.log('mousedown', event.button)
    }
    this.socket.on('connected', () => {
      console.log('connected')
    })
    this.socket.on('setup', (game: GameSummary) => {
      console.log('setup')
    })
    this.socket.on('step', (game: GameSummary) => {
      this.onStep(game)
    })
  }

  onStep (game: GameSummary): void {
    const newServer = !['', game.token].includes(this.renderer.game.token)
    if (newServer) location.reload()
    this.renderer.game = game
  }
}
