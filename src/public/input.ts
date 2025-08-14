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
    console.log('Key pressed:', event.key)
  }

  onmousedown (event: MouseEvent): void {
    console.log('mousedown', event.button)
  }

  ontouchstart (event: TouchEvent): void {}
}
