import { range } from '../math'
import { directInterval, mapSize, moveInterval } from '../params'
import { GameSummary } from '../summaries/gameSummary'
import { Client } from './client'
import { SVG, G, Rect } from '@svgdotjs/svg.js'

export class Renderer {
  client: Client
  svgs = [SVG(), SVG()]
  highlights: Rect[][][] = []
  tiles: Rect[][][] = []
  unitGroups: G[] = []
  goalGroups: G[] = []
  game: GameSummary
  svgDiv = document.getElementById('svgDiv') as HTMLDivElement
  borderColor = 'hsl(0, 0%, 10%)'
  directColor = 'hsl(0, 0%, 70%)'
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
      const mapGroup = svg.group()
      this.tiles[m] = []
      this.highlights[m] = []
      const padding = 0.5
      const x = -0.5 - padding
      const y = -0.5 - padding
      const width = mapSize + 2 * padding
      const height = mapSize + 2 * padding
      svg.flip('y')
      svg.viewbox(x, y, width, height)
      range(mapSize).forEach(x => {
        this.tiles[m][x] = []
        this.highlights[m][x] = []
        range(mapSize).forEach(y => {
          const highlight = mapGroup.rect(1, 1).center(x, y)
          highlight.stroke({ color: this.directColor, width: 0.07 })
          highlight.fill('none')
          highlight.opacity(0)
          this.highlights[m][x][y] = highlight
          const tile = mapGroup.rect(1, 1).center(x, y)
          tile.stroke({ color: this.borderColor, width: 0.07 })
          tile.fill('none')
          this.tiles[m][x][y] = tile
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
      const goal = game.goals[m]
      const goalGroup = svg.group().transform({
        translateX: goal.x,
        translateY: goal.y
      })
      this.goalGroups[m] = goalGroup
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

  onUpdate (game: GameSummary): void {
    let mapColor = this.borderColor
    if (game.scores[0] > game.scores[1]) mapColor = this.teamColors[0]
    if (game.scores[1] > game.scores[0]) mapColor = this.teamColors[1]
    this.tiles.flat().flat().forEach(tile => {
      tile.stroke({ color: mapColor, width: 0.05 })
    })
    game.units.forEach(unit => {
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

  onTick (countdown: number, state: string, newDir: number): void {
    this.game.countdown = countdown
    this.game.state = state
    if (state === 'direct') {
      this.game.units.forEach(unit => {
        const sameRank = unit.rank === this.game.directRank
        const sameTeam = unit.team === this.game.team
        if (sameRank && sameTeam) {
          const unitGroup = this.unitGroups[unit.id]
          const oldTransform = unitGroup.transform()
          unitGroup.transform({
            translateX: oldTransform.translateX,
            translateY: oldTransform.translateY,
            rotate: 90 * newDir
          })
          const highlight = this.highlights[unit.m][unit.x][unit.y]
          highlight.front()
          highlight.opacity(1)
          const a = 4 * countdown / directInterval
          const b = 4 - a
          highlight.attr('stroke-dasharray', `${a} ${b}`)
        }
      })
    } else if (state === 'move') {
      range(2).forEach(m => {
        range(mapSize).forEach(x => {
          range(mapSize).forEach(y => {
            const highlight = this.highlights[m][x][y]
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
