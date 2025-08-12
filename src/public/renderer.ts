import { range } from '../math'
import { GameSummary } from '../summaries/gameSummary'
import { Client } from './client'
import { Circle, SVG } from '@svgdotjs/svg.js'

export class Renderer {
  client: Client
  svgs = [SVG(), SVG()]
  units: Circle[] = []
  game: GameSummary
  svgDiv = document.getElementById('svgDiv') as HTMLDivElement
  borderColor = 'hsl(0, 0%, 10%)'
  crownColor = 'hsl(50, 100%, 50%)'
  teamColors = [
    'hsl(210, 100%, 40%)',
    'hsl(120, 75%, 30%)'
  ]

  constructor (client: Client) {
    this.client = client
    this.game = new GameSummary(1)
    this.svgs.forEach(svg => svg.addTo('#svgDiv'))
    this.onResize()
    window.addEventListener('resize', () => this.onResize())
  }

  setup (game: GameSummary): void {
    this.svgs.forEach((svg, m) => {
      const gridSize = game.gridSize
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
      game.units.filter(unit => unit.m === m).forEach(unit => {
        const xPos = unit.x + 0.5
        const yPos = unit.y + 0.5
        const color = this.teamColors[unit.team]
        const circle = svg.circle(0.9)
        this.units.push(circle)
        circle.center(xPos, yPos)
        circle.fill(color)
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
