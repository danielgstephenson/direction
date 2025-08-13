import { range } from '../math'
import { GameSummary } from '../summaries/gameSummary'
import { Client } from './client'
import { SVG, G } from '@svgdotjs/svg.js'

export class Renderer {
  client: Client
  svgs = [SVG(), SVG()]
  units: G[] = []
  game: GameSummary
  svgDiv = document.getElementById('svgDiv') as HTMLDivElement
  borderColor = 'hsl(0, 0%, 10%)'
  goalColor = 'hsl(50, 100%, 50%)'
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
      const padding = 1
      const x = -0.5 - padding
      const y = -0.5 - padding
      const width = gridSize + 2 * padding
      const height = gridSize + 2 * padding
      svg.flip('y')
      svg.viewbox(x, y, width, height)
      range(gridSize).forEach(x => {
        range(gridSize).forEach(y => {
          const rect = svg.rect(1, 1).center(x, y)
          rect.stroke({ color: this.borderColor, width: 0.07 })
        })
      })
      game.units.filter(unit => unit.m === m).forEach(unit => {
        const color = this.teamColors[unit.team]
        const group = svg.group().transform({
          translateX: unit.x,
          translateY: unit.y,
          rotate: 90 * unit.dir
        })
        const circle = group.circle(0.9).center(0, 0).fill(color)
        const square = group.rect(1, 1).center(0, 0).fill('white')
        const pointer = group.rect(0.4, 0.2).center(0.3, 0).fill('black')
        const mask = group.mask().add(square).add(pointer)
        const startAngle = Math.PI * 0.1
        const endAngle = Math.PI * 1.9
        const angleStep = (endAngle - startAngle) / (unit.rank + 1)
        range(unit.rank).forEach(i => {
          const angle = startAngle + angleStep * (i + 1)
          const x = 0.26 * Math.cos(angle)
          const y = 0.26 * Math.sin(angle)
          group.circle(0.14).center(x, y).fill('black')
        })
        circle.maskWith(mask)
        this.units.push(group)
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
