import { range } from '../math'
import { GameSummary } from '../summaries/gameSummary'
import { Client } from './client'
import { SVG, G } from '@svgdotjs/svg.js'

export class Renderer {
  client: Client
  svgs = [SVG(), SVG()]
  unitGroups: G[] = []
  goalGroups: G[] = []
  game: GameSummary
  svgDiv = document.getElementById('svgDiv') as HTMLDivElement
  borderColor = 'hsl(0, 0%, 10%)'
  goalColor = 'hsl(60, 100%, 50%)'
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
      const gridSize = game.mapSize
      const padding = 0.5
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
        const unitGroup = svg.group().transform({
          translateX: unit.x,
          translateY: unit.y,
          rotate: 90 * unit.dir
        })
        const circle = unitGroup.circle(0.9).center(0, 0).fill(color)
        const square = unitGroup.rect(1, 1).center(0, 0).fill('white')
        const pointer = unitGroup.rect(0.4, 0.2).center(0.3, 0).fill('black')
        const mask = unitGroup.mask().add(square).add(pointer)
        const startAngle = Math.PI * 0.1
        const endAngle = Math.PI * 1.9
        const angleStep = (endAngle - startAngle) / (unit.rank + 1)
        range(unit.rank).forEach(i => {
          const angle = startAngle + angleStep * (i + 1)
          const x = 0.26 * Math.cos(angle)
          const y = 0.26 * Math.sin(angle)
          unitGroup.circle(0.14).center(x, y).fill('black')
        })
        circle.maskWith(mask)
        this.unitGroups[unit.id] = unitGroup
      })
      console.log('game.goals', game.goals)
      const goal = game.goals[m]
      const goalGroup = svg.group().transform({
        translateX: goal.x,
        translateY: goal.y
      })
      this.goalGroups[m] = goalGroup
      const circle = goalGroup.circle(0.6).center(0, 0)
      circle.fill({ opacity: 0 })
      circle.stroke({
        color: this.goalColor,
        opacity: 0.8,
        width: 0.08
      })
    })
  }

  onUpdate (game: GameSummary): void {
    game.units.forEach(unit => {
      const group = this.unitGroups[unit.id]
      const oldTransform = group.transform()
      group.transform({
        translateX: oldTransform.translateX,
        translateY: oldTransform.translateY,
        rotate: 90 * unit.dir
      })
      group.animate(500).transform({
        translateX: unit.x,
        translateY: unit.y,
        rotate: 90 * unit.dir
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
