import { range, Vec2 } from '../math'
import { choiceInterval, endInterval, gridVecs, maxRound, moveInterval, startInterval, unitCount } from '../params'
import { Client } from './client'
import { SVG, G, Rect, Circle } from '@svgdotjs/svg.js'
import { getScores, Summary } from '../summary'
import { stateToLocs } from '../state'
import { setup } from './setup'

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
  fullCircles: Circle[] = []
  padding = 1.25
  team: number = 0
  focus: Vec2 = { x: 0, y: 0 }
  setupComplete = false
  borderColor = 'hsl(0, 0%, 15%)'
  highlightColor = 'hsl(0, 0%, 100%)'
  goalColor = 'hsl(60, 100%, 50%)'
  tieColor = 'hsl(0, 100%, 20%)'
  teamColors = [
    'hsl(120, 75%, 30%)',
    'hsl(210, 100%, 40%)'
  ]

  constructor (client: Client) {
    this.client = client
    this.onResize()
    window.addEventListener('resize', () => this.onResize())
  }

  onTick (summary: Summary, team: number): void {
    if (!this.setupComplete) setup(this, summary)
    this.updateGrid(summary)
    this.team = team
    const activeRank = summary.round % unitCount
    this.updateFocus(activeRank)
    const activeTeam = activeRank % 2
    const unitLocs = stateToLocs(summary.state)
    if (summary.phase === 'choice') {
      range(unitCount).forEach(i => {
        const location = unitLocs[i]
        const position = gridVecs[location]
        const rank = (summary.round + i) % unitCount
        const bodyGroup = this.bodyGroups[rank]
        const dir = rank === activeRank
          ? summary.choice
          : summary.directions[rank]
        bodyGroup.transform({
          translateX: 0,
          translateY: 0,
          rotate: 90 * dir
        })
        if (rank !== activeRank) return
        const highlight = this.highlights[position.x][position.y]
        highlight.front()
        const alpha = activeTeam === this.team ? 0.7 : 0.3
        highlight.opacity(alpha)
        const a = 4 * summary.countdown / choiceInterval
        const b = 4 - a
        highlight.attr('stroke-dasharray', `${a} ${b}`)
      })
    } else if (['start', 'end'].includes(summary.phase)) {
      const interval = summary.phase === 'start' ? startInterval : endInterval
      this.endLines.forEach(endLine => {
        const sideLength = endLine.bbox().width
        const perimeter = 4 * sideLength
        const a = perimeter * summary.countdown / interval
        const b = perimeter - a
        endLine.attr('stroke-dasharray', `${a} ${b}`)
      })
    }
  }

  clearHighlights (): void {
    this.highlights.flat().forEach(highlight => {
      highlight.opacity(0)
    })
  }

  onMove (summary: Summary): void {
    const unitLocs = stateToLocs(summary.state)
    range(unitCount).forEach(i => {
      const location = unitLocs[i]
      const position = gridVecs[location]
      const rank = (summary.round + i) % unitCount
      const unitGroup = this.unitGroups[rank]
      unitGroup.animate(800 * moveInterval).transform({
        translateX: position.x,
        translateY: position.y
      })
    })
  }

  updateGrid (summary: Summary): void {
    const scores = getScores(summary)
    let mapColor = this.borderColor
    this.clearHighlights()
    this.updateFullCircles(summary)
    if (summary.phase === 'end') {
      mapColor = this.tieColor
      if (scores[0] === 2) mapColor = this.teamColors[0]
      if (scores[1] === 2) mapColor = this.teamColors[1]
    } else {
      this.endLines.forEach(endLine => {
        endLine.attr('stroke-dasharray', '')
      })
    }
    this.tiles.flat().forEach(tile => {
      tile.stroke({ color: mapColor })
    })
    this.endLines.forEach(endLine => {
      endLine.stroke({ color: mapColor })
    })
    this.roundLines.forEach(roundLine => {
      const sideLength = roundLine.bbox().width
      const perimeter = 4 * sideLength
      const b = perimeter * summary.round / maxRound
      const a = perimeter - b
      const active = [0, 1].includes(this.team)
      const color = active ? this.teamColors[this.team] : this.borderColor
      roundLine.stroke({
        dasharray: `${a} ${b}`,
        color
      })
    })
  }

  updateFullCircles (summary: Summary): void {
    const opacity = summary.full ? 1 : 0
    this.fullCircles.forEach(circle => {
      let color = this.borderColor
      if ([0, 1].includes(summary.botTeam)) {
        color = this.teamColors[1 - summary.botTeam]
      }
      circle.fill({ opacity, color })
    })
  }

  updateFocus (rank: number): void {
    const svgPoint = this.svg.node.createSVGPoint()
    svgPoint.x = 0
    svgPoint.y = 0
    const unitGroup = this.unitGroups[rank]
    const unitElement = unitGroup.node
    const transform = unitElement.getScreenCTM()
    if (transform == null) return
    const screenPoint = svgPoint.matrixTransform(transform)
    this.focus.x = screenPoint.x
    this.focus.y = screenPoint.y
  }

  onResize (): void {
    const vmin = Math.min(window.innerWidth, window.innerHeight)
    const scale = 1
    this.svg.size(scale * vmin, scale * vmin)
    const direction = window.innerWidth < window.innerHeight ? 'column' : 'row'
    this.svgDiv.style.flexDirection = direction
  }
}
