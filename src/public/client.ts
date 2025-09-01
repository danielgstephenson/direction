import io from 'socket.io-client'
import { Renderer } from './renderer'
import { Input } from './input'
import { Tick } from '../tick'
import { Layout } from '../layout'

export class Client {
  socket = io()
  renderer = new Renderer(this)
  input = new Input(this)
  token = ''

  constructor () {
    this.socket.on('connected', () => {
      console.log('connected')
    })
    this.socket.on('setup', (layout: Layout) => {
      console.log('setup')
      this.checkToken(layout.token)
      this.renderer.setup(layout)
    })
    this.socket.on('layout', (layout: Layout) => {
      this.checkToken(layout.token)
      this.renderer.onLayout(layout)
    })
    this.socket.on('tick', (tick: Tick) => {
      this.checkToken(tick.token)
      this.renderer.onTick(tick)
    })
  }

  checkToken (token: string): void {
    const reloadNeeded = !['', token].includes(this.token)
    if (reloadNeeded) {
      this.renderer.svgDiv.style.display = 'none'
      location.reload()
    }
    this.token = token
  }
}
