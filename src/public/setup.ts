import { range } from '../math'
import { getPosition, goals, gridSize, unitCount } from '../params'
import { stateToLocs } from '../state'
import { Summary } from '../summary'
import { Renderer } from './renderer'

export function setup (renderer: Renderer, summary: Summary): void {
  setupGrids(renderer)
  setupEndLine(renderer)
  setupFullCircles(renderer)
  setupFlags(renderer)
  setupGoals(renderer, summary)
  setupUnits(renderer, summary)
  setupLevelLabel(renderer, summary)
  setupTeamArrows(renderer, summary)
  renderer.setupComplete = true
}

function setupGrids (renderer: Renderer): void {
  const gridGroup = renderer.svg.group()
  const x = -0.5 - renderer.padding
  const y = -0.5 - renderer.padding
  const width = gridSize + 2 * renderer.padding
  const height = gridSize + 2 * renderer.padding
  renderer.svg.flip('y')
  renderer.svg.viewbox(x, y, width, height)
  range(gridSize).forEach(x => {
    renderer.tiles[x] = []
    renderer.highlights[x] = []
    range(gridSize).forEach(y => {
      const highlight = gridGroup.rect(1, 1).center(x, y)
      highlight.stroke({
        color: renderer.highlightColor,
        width: 0.07,
        linecap: 'square'
      })
      highlight.fill('none')
      highlight.opacity(0)
      renderer.highlights[x][y] = highlight
      const tile = gridGroup.rect(1, 1).center(x, y)
      tile.stroke({ color: renderer.borderColor, width: 0.05 })
      tile.fill('none')
      renderer.tiles[x][y] = tile
    })
  })
}

function setupEndLine (renderer: Renderer): void {
  const gap = 0.25
  const width = gridSize + gap
  const height = gridSize + gap
  const center = 0.5 * (gridSize - 1)
  const endLine = renderer.svg.rect(width, height)
  renderer.endLines[0] = endLine
  endLine.fill({ opacity: 0 })
  endLine.stroke({
    color: renderer.borderColor,
    width: 0.05,
    linecap: 'square'
  })
  endLine.center(center, center)
}

function setupUnits (renderer: Renderer, summary: Summary): void {
  const locations = stateToLocs(summary.state)
  locations.forEach((loc, i) => {
    const rank = (summary.round + i) % unitCount
    const team = rank % 2
    const position = getPosition(loc, summary.qTurns)
    const color = renderer.teamColors[team]
    const dir = summary.directions[rank]
    const unitGroup = renderer.svg.group().transform({
      translateX: position.x,
      translateY: position.y
    })
    const bodyGroup = unitGroup.group().transform({
      translateX: 0,
      translateY: 0,
      rotate: 90 * dir
    })
    const circle = bodyGroup.circle(0.9).center(0, 0).fill(color)
    const square = bodyGroup.rect(1, 1).center(0, 0).fill('white')
    const pointerMask = bodyGroup.mask().add(square)
    const pointer = bodyGroup.rect(0.2, 0.15).center(0.4, 0).fill('black')
    if (i !== 0) pointer.opacity(0)
    renderer.pointers[rank] = pointer
    pointerMask.add(pointer)
    circle.maskWith(pointerMask)
    const text = (rank + 1).toFixed(0)
    const path = renderer.font.getPath(text, 0, 0, 0.7)
    const box = path.getBoundingBox()
    const label = unitGroup.path(path.toPathData(4)).flip('y')
    label.center(0, box.y1 - box.y2)
    unitGroup.click((event: MouseEvent) => {
      renderer.client.socket.emit('selectTeam', team)
    })
    renderer.unitGroups[rank] = unitGroup
    renderer.bodyGroups[rank] = bodyGroup
  })
}

function setupGoals (renderer: Renderer, summary: Summary): void {
  renderer.goalGroups = []
  goals.forEach(loc => {
    const position = getPosition(loc, summary.qTurns)
    const goalGroup = renderer.svg.group().transform({
      translateX: position.x,
      translateY: position.y
    })
    renderer.goalGroups.push(goalGroup)
    const rect = goalGroup.rect(0.9, 0.9).center(0, 0)
    rect.fill({
      color: renderer.goalColor,
      opacity: 0.2
    })
    rect.stroke({
      color: renderer.goalColor,
      width: 0.05,
      opacity: 1
    })
    renderer.goalRects.push(rect)
  })
}

function setupFullCircles (renderer: Renderer): void {
  const points = [
    [5, 2],
    [2, 5],
    [-1, 2],
    [2, -1]
  ]
  points.forEach(point => {
    const x = point[0]
    const y = point[1]
    const circle = renderer.svg.circle(0.15)
    circle.center(x, y)
    circle.fill({
      color: renderer.borderColor,
      opacity: 0
    })
    renderer.fullCircles.push(circle)
  })
}

function setupFlags (renderer: Renderer): void {
  const points = [
    [0.5, 5],
    [3.5, 5]
  ]
  points.forEach((point, team) => {
    const x = point[0]
    const y = point[1]
    const rect = renderer.svg.rect(0.4, 0.4)
    rect.center(x, y)
    rect.stroke({
      color: renderer.teamColors[team],
      width: 0.1
    })
    rect.click((event: MouseEvent) => {
      renderer.client.socket.emit('selectTeam', team)
    })
    renderer.flags.push(rect)
  })
}

function setupLevelLabel (renderer: Renderer, summary: Summary): void {
  const group = renderer.svg.group()
  group.translate(2, 5.01)
  group.flip('y')
  const levelLabel = group.path()
  renderer.levelLabels.push(levelLabel)
}

function setupTeamArrows (renderer: Renderer, summary: Summary): void {
  const marker = renderer.svg.defs().marker(3, 3)
  marker.attr({
    id: 'arrowHead',
    viewBox: '0 0 10 10',
    refX: 5,
    refY: 5,
    orient: 'auto'
  })
  marker.path('M 0 0 L 10 5 L 0 10 z')
  marker.fill(renderer.highlightColor)
  range(2).forEach(i => {
    const x0 = 4 * Math.sign(i)
    const x1 = x0 + Math.sign(i - 0.5) * 0.5
    const arrow = renderer.svg.path(`M ${x0},5 L ${x1},5`)
    arrow.fill('none')
    arrow.stroke({
      width: 0.1,
      color: renderer.highlightColor
    })
    arrow.marker('end', marker)
    renderer.teamArrows[i] = arrow
  })
}
