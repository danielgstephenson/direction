import io from 'socket.io-client'
import { Renderer } from './renderer'
import { Input } from './input'
import { Summary } from '../summary'

export class Client {
  socket = io()
  input = new Input(this)
  renderer?: Renderer
  token = ''

  constructor () {
    this.socket.on('connected', (fontBuffer: ArrayBuffer) => {
      console.log('connected')
      const renderer = new Renderer(this, fontBuffer)
      this.renderer = renderer
      this.socket.on('tick', (summary: Summary, team: number) => {
        this.checkToken(summary.token)
        renderer.onTick(summary, team)
      })
      this.socket.on('move', (summary: Summary) => {
        this.checkToken(summary.token)
        renderer.onMove(summary)
      })
    })
  }

  checkToken (token: string): void {
    const reloadNeeded = !['', token].includes(this.token)
    if (reloadNeeded) {
      console.log('reloadNeeded', this.token, token)
      location.reload()
    }
    this.token = token
  }
}
