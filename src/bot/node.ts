import { mean, sample } from '../math'
import { actionSpace, discount } from '../params'
import { advance, Layout, layoutFromId } from '../layout'

export class Node {
  id: string
  team0: boolean
  score: number
  value: number
  bestDirs: number[] = [0, 1, 2, 3]
  outcomes: Node[] = []

  constructor (layout: Layout) {
    this.team0 = layout.team === 0
    this.score = layout.score
    this.value = layout.score
    this.id = layout.id
  }
}

const maxMapSize = 2 ** 20

export function explore (nodes: Map<string, Node>, node: Node, depth: number): void {
  if (node == null) return
  if (Math.abs(node.score) === 1) return
  if (node.outcomes.length === 0) {
    if (nodes.size > maxMapSize) return
    const layout = layoutFromId(node.id)
    actionSpace.forEach(dir => {
      const outcomeLayout = advance(layout, dir)
      const data = nodes.get(outcomeLayout.id)
      if (data != null) node.outcomes[dir] = data
      if (nodes.size > maxMapSize) return
      if (nodes.size % 10000 === 0) {
        console.log('mapSize', Number((nodes.size / maxMapSize).toFixed(3)))
      }
      const outcomeNode = new Node(outcomeLayout)
      nodes.set(outcomeNode.id, outcomeNode)
      node.outcomes[dir] = outcomeNode
    })
  }
  const nextValues = node.outcomes.map(outcome => outcome.value)
  const bestValue = node.team0
    ? Math.min(...nextValues)
    : Math.max(...nextValues)
  const meanValue = mean(nextValues)
  const nextValue = bestValue + 0.001 * meanValue
  node.value = discount * nextValue
  node.bestDirs = actionSpace.filter(dir => {
    return nextValues[dir] === bestValue
  })
  if (depth < 0) return
  const dir = Math.random() < 0.8
    ? sample(node.bestDirs)
    : sample(actionSpace)
  const outcomeNode = node.outcomes[dir]
  explore(nodes, outcomeNode, depth - 1)
}
