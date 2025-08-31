import { range, Vec2 } from '../math'
import { choiceInterval, endInterval, gridSize, maxRound, moveInterval } from '../params'
import { Tick } from '../tick'
import { Client } from './client'
import { SVG, G, Rect } from '@svgdotjs/svg.js'
import { State } from '../state'
import { Unit } from '../unit'
import { fiveLine, fourLine, oneLine, sixLine, threeLine, twoLine } from './numbers'

export class Renderer {
  svgDiv = document.getElementById('svgDiv') as HTMLDivElement
  client: Client
  svg = SVG().addTo('#svgDiv')
  roundLines: Rect[] = []
  endLines: Rect[] = []
  tiles: Rect[][] = []
  highlights: Rect[][] = []
  bodyGroups: G[] = []
  labelGroups: G[] = []
  unitGroups: G[] = []
  goalGroups: G[] = []
  state: State
  padding = 0.5
  team: number = 0
  countdown = 0
  phase = 'choice'
  choice = 0
  focus: Vec2 = { x: 0, y: 0 }

  borderColor = 'hsl(0, 0%, 10%)'
  highlightColor = 'hsl(0, 0%, 100%)'
  goalColor = 'hsl(60, 100%, 50%)'
  tieColor = 'hsl(0, 100%, 20%)'
  teamColors = [
    'hsl(120, 75%, 30%)',
    'hsl(210, 100%, 40%)'
  ]

  constructor (client: Client) {
    this.client = client
    this.state = new State()
    this.onResize()
    window.addEventListener('resize', () => this.onResize())
  }

  onState (newState: State): void {
    newState.units.forEach(unit => {
      const rank = unit.rank
      const unitGroup = this.unitGroups[rank]
      const bodyGroup = this.bodyGroups[rank]
      bodyGroup.transform({
        translateX: 0,
        translateY: 0,
        rotate: 90 * unit.dir
      })
      const oldTransform = unitGroup.transform()
      const moved = oldTransform.translateX !== unit.x || oldTransform.translateY !== unit.y
      if (moved) {
        unitGroup.animate(800 * moveInterval).transform({
          translateX: unit.x,
          translateY: unit.y
        })
      }
    })
    newState.goals.forEach((goal, i) => {
      const goalGroup = this.goalGroups[i]
      goalGroup.transform({
        translateX: goal.x,
        translateY: goal.y
      })
    })
    this.state = newState
  }

  updateGrid (tick: Tick): void {
    let mapColor = this.borderColor
    if (tick.phase === 'end') {
      mapColor = this.tieColor
      if (tick.score < 0) mapColor = this.teamColors[0]
      else if (tick.score > 0) mapColor = this.teamColors[1]
    } else {
      this.endLines.forEach(endLine => {
        endLine.attr('stroke-dasharray', '')
      })
    }
    this.tiles.flat().forEach(tile => {
      tile.stroke({ color: mapColor, width: 0.05 })
    })
    this.endLines.forEach(endLine => {
      endLine.stroke({ color: mapColor, width: 0.05 })
    })
    this.roundLines.forEach(roundLine => {
      const perimeter = 4 * (gridSize + this.padding)
      const b = perimeter * tick.round / maxRound
      const a = perimeter - b
      roundLine.attr('stroke-dasharray', `${a} ${b}`)
    })
  }

  onTick (tick: Tick): void {
    this.updateGrid(tick)
    this.countdown = tick.countdown
    this.phase = tick.phase
    this.choice = tick.choice
    this.team = tick.team
    if (this.phase === 'choice') {
      this.state.units.forEach(unit => {
        if (unit.rank === tick.rank) {
          this.updateFocus(unit)
          const bodyGroup = this.bodyGroups[unit.rank]
          bodyGroup.transform({
            translateX: 0,
            translateY: 0,
            rotate: 90 * this.choice
          })
          const highlight = this.highlights[unit.x][unit.y]
          highlight.front()
          const alpha = unit.team === this.team ? 0.7 : 0.3
          highlight.opacity(alpha)
          const a = 4 * tick.countdown / choiceInterval
          const b = 4 - a
          highlight.attr('stroke-dasharray', `${a} ${b}`)
        }
      })
    } else if (this.phase === 'move') {
      range(gridSize).forEach(x => {
        range(gridSize).forEach(y => {
          const highlight = this.highlights[x][y]
          highlight.opacity(0)
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

  updateFocus (unit: Unit): void {
    const svgPoint = this.svg.node.createSVGPoint()
    svgPoint.x = 0
    svgPoint.y = 0
    const unitGroup = this.unitGroups[unit.rank]
    const unitElement = unitGroup.node
    const transform = unitElement.getScreenCTM()
    if (transform == null) return
    const screenPoint = svgPoint.matrixTransform(transform)
    this.focus.x = screenPoint.x
    this.focus.y = screenPoint.y
  }

  onResize (): void {
    const vmin = Math.min(window.innerWidth, window.innerHeight)
    const scale = 0.8
    this.svg.size(scale * vmin, scale * vmin)
    const direction = window.innerWidth < window.innerHeight ? 'column' : 'row'
    this.svgDiv.style.flexDirection = direction
  }

  setup (newState: State): void {
    this.setupGrids()
    this.setupRoundLines()
    this.setupEndLine()
    this.setupUnits(newState)
    this.setupGoals(newState)
    this.state = newState
  }

  setupGrids (): void {
    const gridGroup = this.svg.group()
    const x = -0.5 - this.padding
    const y = -0.5 - this.padding
    const width = gridSize + 2 * this.padding
    const height = gridSize + 2 * this.padding
    this.svg.flip('y')
    this.svg.viewbox(x, y, width, height)
    range(gridSize).forEach(x => {
      this.tiles[x] = []
      this.highlights[x] = []
      range(gridSize).forEach(y => {
        const highlight = gridGroup.rect(1, 1).center(x, y)
        highlight.stroke({
          color: this.highlightColor,
          width: 0.07,
          linecap: 'square'
        })
        highlight.fill('none')
        highlight.opacity(0)
        this.highlights[x][y] = highlight
        const tile = gridGroup.rect(1, 1).center(x, y)
        tile.stroke({ color: this.borderColor, width: 0.07 })
        tile.fill('none')
        this.tiles[x][y] = tile
      })
    })
  }

  setupRoundLines (): void {
    const width = gridSize + this.padding
    const height = gridSize + this.padding
    const center = 0.5 * (gridSize - 1)
    const roundLine = this.svg.rect(width, height)
    roundLine.fill({ opacity: 0 })
    roundLine.stroke({
      color: this.borderColor,
      width: 0.06,
      linecap: 'square'
    })
    roundLine.center(center, center)
    this.roundLines[0] = roundLine
  }

  setupEndLine (): void {
    const width = gridSize + 0.5 * this.padding
    const height = gridSize + 0.5 * this.padding
    const center = 0.5 * (gridSize - 1)
    const endLine = this.svg.rect(width, height)
    this.endLines[0] = endLine
    endLine.fill({ opacity: 0 })
    endLine.stroke({
      color: this.borderColor,
      width: 0.07,
      linecap: 'square'
    })
    endLine.center(center, center)
  }

  setupUnits (newState: State): void {
    newState.units.forEach(unit => {
      const rank = unit.rank
      const color = this.teamColors[unit.team]
      const unitGroup = this.svg.group().transform({
        translateX: unit.x,
        translateY: unit.y
      })
      const bodyGroup = unitGroup.group().transform({
        translateX: 0,
        translateY: 0,
        rotate: 90 * unit.dir
      })
      const labelGroup = unitGroup.group().transform({
        translateX: 0,
        translateY: 0
      })
      const circle = bodyGroup.circle(0.9).center(0, 0).fill(color)
      const square = bodyGroup.rect(1, 1).center(0, 0).fill('white')
      const pointer = bodyGroup.rect(0.2, 0.15).center(0.4, 0).fill('black')
      const pointerMask = bodyGroup.mask().add(square).add(pointer)
      circle.maskWith(pointerMask)
      const labelArray: number[] = []
      if (rank + 1 === 1) labelArray.push(...oneLine)
      if (rank + 1 === 2) labelArray.push(...twoLine)
      if (rank + 1 === 3) labelArray.push(...threeLine)
      if (rank + 1 === 4) labelArray.push(...fourLine)
      if (rank + 1 === 5) labelArray.push(...fiveLine)
      if (rank + 1 === 6) labelArray.push(...sixLine)
      const label = labelGroup.polyline(labelArray)
      label.stroke({
        color: 'black',
        width: 0.09,
        linecap: 'round',
        linejoin: 'round'
      })
      label.fill('none')
      this.unitGroups[rank] = unitGroup
      this.bodyGroups[rank] = bodyGroup
      this.labelGroups[rank] = labelGroup
    })
  }

  setupGoals (newState: State): void {
    this.goalGroups = []
    newState.goals.forEach(goal => {
      const goalGroup = this.svg.group().transform({
        translateX: goal.x,
        translateY: goal.y
      })
      this.goalGroups.push(goalGroup)
      const circle = goalGroup.circle(0.7).center(0, 0)
      circle.fill('none')
      circle.stroke({
        color: this.goalColor,
        width: 0.05,
        opacity: 0.7
      })
    })
  }
}
