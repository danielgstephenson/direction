import { range } from '../math'
import { choiceInterval, gridSize, moveInterval } from '../params'
import { State } from '../state'
import { Tick } from '../tick'
import { Client } from './client'
import { SVG, G, Rect } from '@svgdotjs/svg.js'

export class Renderer {
  svgDiv = document.getElementById('svgDiv') as HTMLDivElement
  client: Client
  svgs = [SVG(), SVG()]
  highlights: Rect[][][] = []
  tiles: Rect[][][] = []
  unitGroups: G[] = []
  goalGroups: G[] = []
  state: State
  team: number = 0
  countdown = 0
  phase = 'choice'
  choice = 0

  borderColor = 'hsl(0, 0%, 10%)'
  directColor = 'hsl(0, 0%, 70%)'
  goalColor = 'hsl(60, 100%, 50%)'
  teamColors = [
    'hsl(210, 100%, 40%)',
    'hsl(120, 75%, 30%)'
  ]

  constructor (client: Client) {
    this.client = client
    this.state = new State()
    this.svgs.forEach(svg => svg.addTo('#svgDiv'))
    this.onResize()
    window.addEventListener('resize', () => this.onResize())
  }

  setup (state: State): void {
    this.svgs.forEach((svg, grid) => {
      const mapGroup = svg.group()
      this.tiles[grid] = []
      this.highlights[grid] = []
      const padding = 0.5
      const x = -0.5 - padding
      const y = -0.5 - padding
      const width = gridSize + 2 * padding
      const height = gridSize + 2 * padding
      svg.flip('y')
      svg.viewbox(x, y, width, height)
      range(gridSize).forEach(x => {
        this.tiles[grid][x] = []
        this.highlights[grid][x] = []
        range(gridSize).forEach(y => {
          const highlight = mapGroup.rect(1, 1).center(x, y)
          highlight.stroke({ color: this.directColor, width: 0.07 })
          highlight.fill('none')
          highlight.opacity(0)
          this.highlights[grid][x][y] = highlight
          const tile = mapGroup.rect(1, 1).center(x, y)
          tile.stroke({ color: this.borderColor, width: 0.07 })
          tile.fill('none')
          this.tiles[grid][x][y] = tile
        })
      })
      state.units.filter(unit => unit.grid === grid).forEach(unit => {
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
      const goalGroup = svg.group().transform({
        translateX: state.goal.x,
        translateY: state.goal.y
      })
      this.goalGroups[grid] = goalGroup
      const circle = goalGroup.circle(0.6).center(0, 0)
      // Make the goal a star instead of a circle
      circle.fill({ opacity: 0 })
      circle.stroke({
        color: this.goalColor,
        opacity: 0.8,
        width: 0.08
      })
    })
  }

  onState (state: State): void {
    let mapColor = this.borderColor
    if (state.scores[0] > state.scores[1]) mapColor = this.teamColors[0]
    if (state.scores[1] > state.scores[0]) mapColor = this.teamColors[1]
    this.tiles.flat().flat().forEach(tile => {
      tile.stroke({ color: mapColor, width: 0.05 })
    })
    state.units.forEach(unit => {
      const group = this.unitGroups[unit.id]
      const oldTransform = group.transform()
      group.transform({
        translateX: oldTransform.translateX,
        translateY: oldTransform.translateY,
        rotate: 90 * unit.dir
      })
      const moved = oldTransform.translateX !== unit.x || oldTransform.translateY !== unit.y
      if (moved) {
        group.animate(800 * moveInterval).transform({
          translateX: unit.x,
          translateY: unit.y,
          rotate: 90 * unit.dir
        })
      }
    })
  }

  onTick (tick: Tick): void {
    this.countdown = tick.countdown
    this.phase = tick.phase
    this.choice = tick.choice
    this.team = tick.team
    if (this.phase === 'choice') {
      this.state.units.forEach(unit => {
        const sameRank = unit.rank === this.state.moveRank
        const sameTeam = unit.team === this.team
        if (sameRank && sameTeam) {
          const unitGroup = this.unitGroups[unit.id]
          const oldTransform = unitGroup.transform()
          unitGroup.transform({
            translateX: oldTransform.translateX,
            translateY: oldTransform.translateY,
            rotate: 90 * this.choice
          })
          const highlight = this.highlights[unit.grid][unit.x][unit.y]
          highlight.front()
          highlight.opacity(1)
          const a = 4 * tick.countdown / choiceInterval
          const b = 4 - a
          highlight.attr('stroke-dasharray', `${a} ${b}`)
        }
      })
    } else if (this.phase === 'move') {
      range(2).forEach(grid => {
        range(gridSize).forEach(x => {
          range(gridSize).forEach(y => {
            const highlight = this.highlights[grid][x][y]
            highlight.opacity(0)
          })
        })
      })
    }
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
