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
      this.renderer.setup(state)
      this.renderer.state = state
    })
    this.socket.on('state', (state: State) => {
      this.renderer.onState(state)
      this.renderer.state = state
    })
    this.socket.on('tick', (tick: Tick) => {
      const newServer = !['', tick.token].includes(this.token)
      if (newServer) location.reload()
      this.token = tick.token
      this.renderer.onTick(tick)
    })
  }
}
