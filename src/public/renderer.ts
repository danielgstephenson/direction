import { range } from '../math'
import { GameSummary } from '../summaries/gameSummary'
import { Client } from './client'
import { SVG } from '@svgdotjs/svg.js'

export class Renderer {
  client: Client
  svgs = [SVG(), SVG()]
  game: GameSummary
  svgDiv = document.getElementById('svgDiv') as HTMLDivElement
  borderColor = 'hsl(0, 0%, 10%)'
  crownColor = 'hsl(50, 100%, 50%)'
  teamColors = [
    'hsl(200, 100%, 50%)',
    'hsl(120, 75%, 40%)'
  ]

  constructor (client: Client) {
    this.client = client
    this.game = new GameSummary(1)
    this.svgs.forEach(svg => svg.addTo('#svgDiv'))
    this.onResize()
    window.addEventListener('resize', () => this.onResize())
    this.setup()
  }

  setup (): void {
    this.svgs.forEach(svg => {
      const gridSize = 8
      const padding = 0.5
      svg.viewbox(`-${padding} -${padding} ${gridSize + 2 * padding} ${gridSize + 2 * padding}`)
      range(gridSize).forEach(x => {
        range(gridSize).forEach(y => {
          const xPos = x + 0.5
          const yPos = y + 0.5
          const rect = svg.rect(1, 1)
          rect.center(xPos, yPos)
          rect.stroke({ color: this.borderColor, width: 0.07 })
        })
      })
    })
  }

  onResize (): void {
    const vmin = Math.min(window.innerWidth, window.innerHeight)
    const vmax = Math.max(window.innerWidth, window.innerHeight)
    const svgSize = Math.min(0.5 * vmax, vmin)
    this.svgs.forEach(svg => svg.size(svgSize, svgSize))
    const direction = window.innerWidth < window.innerHeight ? 'column' : 'row'
    this.svgDiv.style.flexDirection = direction
  }
}
