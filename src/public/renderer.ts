import { range, Vec2 } from '../math'
import { choiceInterval, endInterval, gridSize, maxRound, moveInterval } from '../params'
import { OldState } from '../oldState'
import { Tick } from '../tick'
import { OldUnit } from '../oldUnit'
import { Client } from './client'
import { SVG, G, Rect } from '@svgdotjs/svg.js'

export class Renderer {
  svgDiv = document.getElementById('svgDiv') as HTMLDivElement
  client: Client
  svgs = [SVG(), SVG()]
  roundLines: Rect[] = []
  endLines: Rect[] = []
  highlights: Rect[][][] = []
  tiles: Rect[][][] = []
  unitGroups: G[][] = [[], []]
  goalGroups: G[] = []
  state: OldState
  padding = 0.5
  team: number = 0
  countdown = 0
  phase = 'choice'
  choice = 0
  focus: Vec2 = { x: 0, y: 0 }

  borderColor = 'hsl(0, 0%, 10%)'
  directColor = 'hsl(0, 0%, 70%)'
  goalColor = 'hsl(60, 100%, 50%)'
  tieColor = 'hsl(0, 100%, 20%)'
  teamColors = [
    'hsl(210, 100%, 40%)',
    'hsl(120, 75%, 30%)'
  ]

  constructor (client: Client) {
    this.client = client
    this.state = new OldState()
    this.svgs.forEach(svg => svg.addTo('#svgDiv'))
    this.onResize()
    window.addEventListener('resize', () => this.onResize())
  }

  onState (newState: OldState): void {
    this.updateGrid(newState)
    newState.regions.forEach((region, r) => {
      region.units.forEach((unit, rank) => {
        const unitGroup = this.unitGroups[unit.region][rank]
        const oldTransform = unitGroup.transform()
        unitGroup.transform({
          translateX: oldTransform.translateX,
          translateY: oldTransform.translateY,
          rotate: 90 * unit.dir
        })
        const moved = oldTransform.translateX !== unit.x || oldTransform.translateY !== unit.y
        if (moved) {
          unitGroup.animate(800 * moveInterval).transform({
            translateX: unit.x,
            translateY: unit.y,
            rotate: 90 * unit.dir
          })
        }
      })
    })
    this.state = newState
  }

  updateGrid (newState: OldState): void {
    const scores = [0, 0]
    newState.regions.forEach(region => {
      scores[0] += region.scores[0]
      scores[1] += region.scores[1]
    })
    let mapColor = this.borderColor
    if (newState.phase === 'end') {
      mapColor = this.tieColor
      if (scores[0] > scores[1]) mapColor = this.teamColors[0]
      else if (scores[1] > scores[0]) mapColor = this.teamColors[1]
    } else {
      this.endLines.forEach(endLine => {
        endLine.attr('stroke-dasharray', '')
      })
    }
    this.tiles.flat().flat().forEach(tile => {
      tile.stroke({ color: mapColor, width: 0.05 })
    })
    this.endLines.forEach(endLine => {
      endLine.stroke({ color: mapColor, width: 0.05 })
    })
    this.roundLines.forEach(roundLine => {
      const perimeter = 4 * (gridSize + this.padding)
      const b = perimeter * newState.round / maxRound
      const a = perimeter - b
      roundLine.attr('stroke-dasharray', `${a} ${b}`)
    })
  }

  onTick (tick: Tick): void {
    this.countdown = tick.countdown
    this.phase = tick.phase
    this.choice = tick.choice
    this.team = tick.team
    if (this.phase === 'choice') {
      this.state.regions.forEach((region, r) => {
        region.units.forEach(unit => {
          const sameRank = unit.rank === region.moveRank
          const sameTeam = unit.team === this.team
          if (sameRank && sameTeam) {
            this.updateFocus(unit)
            const unitGroup = this.unitGroups[unit.region][unit.rank]
            const oldTransform = unitGroup.transform()
            unitGroup.transform({
              translateX: oldTransform.translateX,
              translateY: oldTransform.translateY,
              rotate: 90 * this.choice
            })
            const highlight = this.highlights[unit.region][unit.x][unit.y]
            highlight.front()
            highlight.opacity(1)
            const a = 4 * tick.countdown / choiceInterval
            const b = 4 - a
            highlight.attr('stroke-dasharray', `${a} ${b}`)
          }
        })
      })
    } else if (this.phase === 'move') {
      range(2).forEach(r => {
        range(gridSize).forEach(x => {
          range(gridSize).forEach(y => {
            const highlight = this.highlights[r][x][y]
            highlight.opacity(0)
          })
        })
      })
    } else if (this.phase === 'end') {
      const perimeter = 4 * (gridSize + 0.5 * this.padding)
      const a = perimeter * tick.countdown / endInterval
      const b = perimeter - a
      this.endLines.forEach(endLine => {
        endLine.attr('stroke-dasharray', `${a} ${b}`)
      })
    }
  }

  updateFocus (unit: OldUnit): void {
    const svg = this.svgs[unit.region]
    const svgPoint = svg.node.createSVGPoint()
    svgPoint.x = 0
    svgPoint.y = 0
    const unitGroup = this.unitGroups[unit.region][unit.rank]
    const unitElement = unitGroup.node
    const transform = unitElement.getScreenCTM()
    if (transform == null) return
    const screenPoint = svgPoint.matrixTransform(transform)
    this.focus.x = screenPoint.x
    this.focus.y = screenPoint.y
  }

  onResize (): void {
    const vmin = Math.min(window.innerWidth, window.innerHeight)
    const vmax = Math.max(window.innerWidth, window.innerHeight)
    const svgSize = Math.min(0.5 * vmax, vmin)
    this.svgs.forEach(svg => svg.size(svgSize, svgSize))
    const direction = window.innerWidth < window.innerHeight ? 'column' : 'row'
    this.svgDiv.style.flexDirection = direction
  }

  setup (newState: OldState): void {
    this.setupGrids()
    this.setupRoundLines()
    this.setupEndLines()
    this.setupUnits(newState)
    this.setupGoals(newState)
    this.state = newState
  }

  setupGrids (): void {
    this.svgs.forEach((svg, r) => {
      const regionGroup = svg.group()
      this.tiles[r] = []
      this.highlights[r] = []
      const x = -0.5 - this.padding
      const y = -0.5 - this.padding
      const width = gridSize + 2 * this.padding
      const height = gridSize + 2 * this.padding
      svg.flip('y')
      svg.viewbox(x, y, width, height)
      range(gridSize).forEach(x => {
        this.tiles[r][x] = []
        this.highlights[r][x] = []
        range(gridSize).forEach(y => {
          const highlight = regionGroup.rect(1, 1).center(x, y)
          highlight.stroke({
            color: this.directColor,
            width: 0.07,
            linecap: 'square'
          })
          highlight.fill('none')
          highlight.opacity(0)
          this.highlights[r][x][y] = highlight
          const tile = regionGroup.rect(1, 1).center(x, y)
          tile.stroke({ color: this.borderColor, width: 0.07 })
          tile.fill('none')
          this.tiles[r][x][y] = tile
        })
      })
    })
  }

  setupRoundLines (): void {
    const width = gridSize + this.padding
    const height = gridSize + this.padding
    const center = 0.5 * (gridSize - 1)
    this.svgs.forEach((svg, r) => {
      const roundLine = svg.rect(width, height)
      roundLine.fill({ opacity: 0 })
      roundLine.stroke({
        color: this.borderColor,
        width: 0.06,
        linecap: 'square'
      })
      roundLine.center(center, center)
      this.roundLines[r] = roundLine
    })
  }

  setupEndLines (): void {
    const width = gridSize + 0.5 * this.padding
    const height = gridSize + 0.5 * this.padding
    const center = 0.5 * (gridSize - 1)
    this.svgs.forEach((svg, r) => {
      const endLine = svg.rect(width, height)
      endLine.fill({ opacity: 0 })
      endLine.stroke({
        color: this.borderColor,
        width: 0.07,
        linecap: 'square'
      })
      endLine.center(center, center)
      this.endLines[r] = endLine
    })
  }

  setupUnits (newState: OldState): void {
    this.svgs.forEach((svg, r) => {
      const region = newState.regions[r]
      region.units.forEach((unit, rank) => {
        const color = this.teamColors[unit.team]
        const unitGroup = svg.group().transform({
          translateX: unit.x,
          translateY: unit.y,
          rotate: 90 * unit.dir
        })
        const circle = unitGroup.circle(0.9).center(0, 0).fill(color)
        const square = unitGroup.rect(1, 1).center(0, 0).fill('white')
        const pointer = unitGroup.rect(0.4, 0.15).center(0.3, 0).fill('black')
        const mask = unitGroup.mask().add(square).add(pointer)
        const startAngle = Math.PI * 0.05
        const endAngle = Math.PI * 1.95
        const eyes = unit.rank + 1
        const angleStep = (endAngle - startAngle) / (eyes + 1)
        range(eyes).forEach(i => {
          const angle = startAngle + angleStep * (i + 1)
          const x = 0.28 * Math.cos(angle)
          const y = 0.28 * Math.sin(angle)
          unitGroup.circle(0.14).center(x, y).fill('black')
        })
        circle.maskWith(mask)
        this.unitGroups[unit.region][rank] = unitGroup
      })
    })
  }

  setupGoals (newState: OldState): void {
    this.svgs.forEach((svg, r) => {
      const region = newState.regions[r]
      const goalGroup = svg.group().transform({
        translateX: region.goal.x,
        translateY: region.goal.y
      })
      this.goalGroups[r] = goalGroup
      const startAngle = 0.5 * Math.PI
      const spikes = 5
      const outerRadius = 0.25
      const innerRadius = 0.12
      const starCoordinates: number[] = []
      range(2 * spikes).forEach(i => {
        const angle = startAngle + i * Math.PI / spikes
        const r = (i % 2 === 0) ? outerRadius : innerRadius
        const x = r * Math.cos(angle)
        const y = r * Math.sin(angle)
        starCoordinates.push(x, y)
      })
      goalGroup.polygon(starCoordinates).fill({
        color: this.goalColor,
        opacity: 0.8
      })
    })
  }
}
