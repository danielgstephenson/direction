import io from 'socket.io-client'
import { Renderer } from './renderer'
import { Input } from './input'
import { Tick } from '../tick'
import { State } from '../state'

export class Client {
  socket = io()
  renderer = new Renderer(this)
  input = new Input(this)
  token = ''

  constructor () {
    this.socket.on('connected', () => {
      console.log('connected')
    })
    this.socket.on('setup', (state: State) => {
      console.log('setup')
      this.checkToken(state.token)
      this.renderer.setup(state)
    })
    this.socket.on('state', (state: State) => {
      this.checkToken(state.token)
      this.renderer.onState(state)
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
