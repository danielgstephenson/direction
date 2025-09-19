import { range } from '../math'
import { gridSize, gridVecs, unitCount } from '../params'
import { stateToLocs } from '../state'
import { Summary } from '../summary'
import { fiveLine, fourLine, oneLine, sixLine, threeLine, twoLine } from './numbers'
import { Renderer } from './renderer'

export function setup (renderer: Renderer, summary: Summary): void {
  setupGrids(renderer)
  setupRoundLine(renderer)
  setupEndLine(renderer)
  setupBotCircles(renderer)
  setupUnits(renderer, summary)
  setupGoals(renderer, summary)
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

function setupRoundLine (renderer: Renderer): void {
  const gap = 0.5
  const width = gridSize + gap
  const height = gridSize + gap
  const center = 0.5 * (gridSize - 1)
  const roundLine = renderer.svg.rect(width, height)
  roundLine.fill({ opacity: 0 })
  roundLine.stroke({
    color: renderer.borderColor,
    width: 0.05,
    linecap: 'square'
  })
  roundLine.center(center, center)
  renderer.roundLines[0] = roundLine
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
    const position = gridVecs[loc]
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
    unitGroup.click((event: MouseEvent) => {
      renderer.client.socket.emit('selectTeam', team)
    })
    renderer.unitGroups[rank] = unitGroup
    renderer.bodyGroups[rank] = bodyGroup
    renderer.labelGroups[rank] = labelGroup
  })
}

function setupGoals (renderer: Renderer, summary: Summary): void {
  renderer.goalGroups = []
  summary.goals.forEach(loc => {
    const position = gridVecs[loc]
    const goalGroup = renderer.svg.group().transform({
      translateX: position.x,
      translateY: position.y
    })
    renderer.goalGroups.push(goalGroup)
    const circle = goalGroup.circle(0.7).center(0, 0)
    circle.fill('none')
    circle.stroke({
      color: renderer.goalColor,
      width: 0.05,
      opacity: 0.7
    })
  })
}

function setupBotCircles (renderer: Renderer): void {
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
