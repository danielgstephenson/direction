import { range, Vec2 } from '../math'
import { choiceInterval, endInterval, getPosition, goals, maxRound, moveInterval, teamInterval, unitCount } from '../params'
import { Client } from './client'
import { SVG, G, Rect, Circle, Path } from '@svgdotjs/svg.js'
import { getScores, Summary } from '../summary'
import { stateToLocs } from '../state'
import { setup } from './setup'
import * as opentype from 'opentype.js'

export class Renderer {
  font: opentype.Font
  svgDiv = document.getElementById('svgDiv') as HTMLDivElement
  client: Client
  svg = SVG().addTo('#svgDiv')
  roundLines: Rect[] = []
  endLines: Rect[] = []
  tiles: Rect[][] = []
  highlights: Rect[][] = []
  bodyGroups: G[] = []
  unitGroups: G[] = []
  goalGroups: G[] = []
  fullCircles: Circle[] = []
  flags: Rect[] = []
  levelLabels: Path[] = []
  pointers: Rect[] = []
  padding = 1.25
  team: number = 0
  round = 0
  focus: Vec2 = { x: 0, y: 0 }
  setupComplete = false
  borderColor = 'hsl(0, 0%, 15%)'
  highlightColor = 'hsl(0, 0%, 100%)'
  goalColor = 'hsl(60, 100%, 30%)'
  tieColor = 'hsl(0, 100%, 30%)'
  teamColors = [
    'hsl(120, 75%, 30%)',
    'hsl(210, 100%, 40%)'
  ]

  constructor (client: Client, fontBuffer: ArrayBuffer) {
    this.font = opentype.parse(fontBuffer)
    this.client = client
    this.onResize()
    window.addEventListener('resize', () => this.onResize())
  }

  onTick (summary: Summary, team: number): void {
    if (!this.setupComplete) setup(this, summary)
    this.updateGrid(summary)
    this.updateDirections(summary)
    this.team = team
    const activeRank = summary.round % unitCount
    this.updateFocus(activeRank)
    const activeTeam = activeRank % 2
    const unitLocs = stateToLocs(summary.state)
    if (summary.phase === 'choice') {
      range(unitCount).forEach(i => {
        const location = unitLocs[i]
        const position = getPosition(location, summary.qTurns)
        const rank = (summary.round + i) % unitCount
        const pointer = this.pointers[rank]
        pointer.opacity(0)
        if (rank !== activeRank) return
        pointer.opacity(1)
        const highlight = this.highlights[position.x][position.y]
        highlight.front()
        const bright = activeTeam === this.team || (summary.round === 0 && !summary.versus)
        const alpha = bright ? 0.7 : 0.3
        highlight.opacity(alpha)
        const a = 4 * summary.countdown / choiceInterval
        const b = 4 - a
        if (a === 0) highlight.opacity(0)
        highlight.attr('stroke-dasharray', `${a} ${b}`)
      })
    } else if (['end', 'team'].includes(summary.phase)) {
      const interval = summary.phase === 'end' ? endInterval : teamInterval
      this.endLines.forEach(endLine => {
        const sideLength = endLine.bbox().width
        const perimeter = 4 * sideLength
        const a = perimeter * summary.countdown / interval
        const b = perimeter - a
        endLine.attr('stroke-dasharray', `${a} ${b}`)
      })
    }
  }

  updateDirections (summary: Summary): void {
    const activeRank = summary.round % unitCount
    range(unitCount).forEach(i => {
      const rank = (summary.round + i) % unitCount
      const bodyGroup = this.bodyGroups[rank]
      const dir = rank === activeRank
        ? (summary.action + summary.qTurns) % 4
        : (summary.directions[rank] + summary.qTurns) % 4
      bodyGroup.transform({
        translateX: 0,
        translateY: 0,
        rotate: 90 * dir
      })
    })
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
      const position = getPosition(location, summary.qTurns)
      const rank = (summary.round + i) % unitCount
      const unitGroup = this.unitGroups[rank]
      if (this.round <= summary.round) {
        unitGroup.animate(800 * moveInterval).transform({
          translateX: position.x,
          translateY: position.y
        })
      } else {
        unitGroup.transform({
          translateX: position.x,
          translateY: position.y
        })
      }
    })
    this.round = summary.round
  }

  updateGrid (summary: Summary): void {
    const scores = getScores(summary)
    let mapColor = this.borderColor
    this.clearHighlights()
    this.updateFullCircles(summary)
    this.updateFlags(summary)
    this.updateGoals(summary)
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
      tile.stroke({ color: this.borderColor })
    })
    this.endLines.forEach(endLine => {
      endLine.stroke({ color: mapColor })
    })
    this.roundLines.forEach(roundLine => {
      const sideLength = roundLine.bbox().width
      const perimeter = 4 * sideLength
      const b = perimeter * summary.round / maxRound
      const a = perimeter - b
      const color = this.borderColor
      roundLine.stroke({
        dasharray: `${a} ${b}`,
        color
      })
    })
    this.levelLabels.forEach(levelLabel => {
      const text = summary.level.toFixed(0)
      const path = this.font.getPath(text, 0, 0, 0.5)
      levelLabel.attr({ d: path.toPathData(4) })
      levelLabel.fill('hsl(0,0%,50%)')
      const box = path.getBoundingBox()
      levelLabel.transform({
        translateX: 0.5 * (box.x1 - box.x2),
        translateY: 0.5 * (box.y2 - box.y1)
      })
    })
  }

  updateGoals (summary: Summary): void {
    goals.forEach((loc, i) => {
      const position = getPosition(loc, summary.qTurns)
      this.goalGroups[i].transform({
        translateX: position.x,
        translateY: position.y
      })
    })
  }

  updateFlags (summary: Summary): void {
    this.flags.forEach((flag, team) => {
      const teamColor = this.teamColors[this.team]
      const color = team === this.team ? teamColor : 'black'
      const opacity = summary.versus ? 1 : 0
      flag.opacity(opacity)
      flag.fill(color)
    })
  }

  updateFullCircles (summary: Summary): void {
    const opacity = 0 // summary.full ? 1 : 0
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
