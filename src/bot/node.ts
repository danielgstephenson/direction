import { choose as sample } from '../math'
import { directions, discount } from '../params'
import { advance, State, stateFromId } from '../state'

export class Node {
  id: string
  team0: boolean
  score: number
  value: number
  outcomes: Node[] = []

  constructor (state: State) {
    this.team0 = state.team === 0
    this.score = state.score
    this.value = state.score
    this.id = state.id
  }
}

export function explore (nodes: Map<string, Node>, node: Node, depth: number): void {
  if (Math.abs(node.score) === 1) return
  setupOutcomes(nodes, node)
  const nextValues = node.outcomes.map(outcome => outcome.value)
  const bestValue = node.team0
    ? Math.min(...nextValues)
    : Math.max(...nextValues)
  node.value = discount * bestValue
  if (depth < 0) return
  const bestDirs = directions.filter(dir => {
    return nextValues[dir] === bestValue
  })
  const dir = Math.random() < 0.8
    ? sample(bestDirs)
    : sample(directions)
  const outcomeNode = node.outcomes[dir]
  explore(nodes, outcomeNode, depth - 1)
}

export function setupOutcomes (nodes: Map<string, Node>, node: Node): void {
  if (node.outcomes.length > 0) return
  const state = stateFromId(node.id)
  node.outcomes = directions.map(dir => {
    const outcomeState = advance(state, dir)
    const data = nodes.get(outcomeState.id)
    if (data != null) return data
    const outcomeNode = new Node(outcomeState)
    nodes.set(outcomeNode.id, outcomeNode)
    return outcomeNode
  })
}
