import { range, Vec2 } from '../math'
import { choiceInterval, endInterval, gridSize, gridVecs, maxRound, moveInterval, unitCount } from '../params'
import { Client } from './client'
import { SVG, G, Rect } from '@svgdotjs/svg.js'
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
  padding = 0.5
  team: number = 0
  focus: Vec2 = { x: 0, y: 0 }
  setupComplete = false

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
      this.clearHighlights()
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
    } else if (summary.phase === 'move') {
      this.clearHighlights()
    } else if (summary.phase === 'end') {
      this.clearHighlights()
      const perimeter = 4 * (gridSize + 0.5 * this.padding)
      const a = perimeter * summary.countdown / endInterval
      const b = perimeter - a
      this.endLines.forEach(endLine => {
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
      tile.stroke({ color: mapColor, width: 0.05 })
    })
    this.endLines.forEach(endLine => {
      endLine.stroke({ color: mapColor, width: 0.05 })
    })
    this.roundLines.forEach(roundLine => {
      const perimeter = 4 * (gridSize + this.padding)
      const b = perimeter * summary.round / maxRound
      const a = perimeter - b
      roundLine.attr('stroke-dasharray', `${a} ${b}`)
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
    const scale = 0.8
    this.svg.size(scale * vmin, scale * vmin)
    const direction = window.innerWidth < window.innerHeight ? 'column' : 'row'
    this.svgDiv.style.flexDirection = direction
  }
}
