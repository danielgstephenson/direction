import { Client } from './client'

export class Input {
  client: Client

  constructor (client: Client) {
    this.client = client
    window.onkeydown = (event: KeyboardEvent) => this.onkeydown(event)
    window.onmousedown = (event: MouseEvent) => this.onmousedown(event)
    window.ontouchstart = (event: TouchEvent) => this.ontouchstart(event)
    window.oncontextmenu = () => false
  }

  onkeydown (event: KeyboardEvent): void {
    if (event.key === 'ArrowUp' || event.key === 'w') {
      this.client.socket.emit('choice', 1)
    } else if (event.key === 'ArrowDown' || event.key === 's') {
      this.client.socket.emit('choice', 3)
    } else if (event.key === 'ArrowLeft' || event.key === 'a') {
      this.client.socket.emit('choice', 2)
      this.client.socket.emit('selectTeam', 0)
    } else if (event.key === 'ArrowRight' || event.key === 'd') {
      this.client.socket.emit('choice', 0)
      this.client.socket.emit('selectTeam', 1)
    }
  }

  onmousedown (event: MouseEvent): void {
    const focus = this.client.renderer.focus
    const x = event.clientX - focus.x
    const y = focus.y - event.clientY
    let dir = 0
    if (Math.abs(x) > Math.abs(y)) {
      dir = x > 0 ? 0 : 2
    } else {
      dir = y > 0 ? 1 : 3
    }
    this.client.socket.emit('choice', dir)
  }

  ontouchstart (event: TouchEvent): void {}
}
