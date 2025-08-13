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
      this.renderer.setup(game)
    })
    this.socket.on('update', (game: GameSummary) => {
      this.onUpdate(game)
    })
  }

  onUpdate (game: GameSummary): void {
    const newServer = !['', game.token].includes(this.renderer.game.token)
    if (newServer) location.reload()
    this.renderer.onUpdate(game)
    this.renderer.game = game
  }
}
