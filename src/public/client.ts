import io from 'socket.io-client'
import { Renderer } from './renderer'
import { Input } from './input'
import { Summary } from '../summary'

export class Client {
  socket = io()
  renderer = new Renderer(this)
  input = new Input(this)
  token = ''

  constructor () {
    this.socket.on('connected', () => {
      console.log('connected')
    })
    this.socket.on('tick', (summary: Summary, team: number) => {
      this.checkToken(summary.token)
      this.renderer.onTick(summary, team)
    })
    this.socket.on('move', (summary: Summary) => {
      this.checkToken(summary.token)
      this.renderer.onMove(summary)
    })
  }

  checkToken (token: string): void {
    const reloadNeeded = !['', token].includes(this.token)
    if (reloadNeeded) {
      console.log('reloadNeeded', this.token, token)
      this.renderer.svgDiv.style.display = 'none'
      location.reload()
    }
    this.token = token
  }
}
