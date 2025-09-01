import { range } from '../math'
import { maxRound } from '../params'
import { Layout } from '../layout'
import { Worker } from 'worker_threads'
import path from 'path'
import { explore, Node } from './node'

export class Bot {
  nodes = new Map<string, Node>()
  finished = false
  root: Node

  constructor (layout: Layout) {
    this.root = new Node(layout)
    this.nodes.set(this.root.id, this.root)
    this.think()
  }

  think (): void {
    range(50).forEach(_ => {
      explore(this.nodes, this.root, maxRound)
    })
    if (this.finished) {
      this.nodes.clear()
      return
    }
    setTimeout(() => this.think(), 10)
  }

  focus (layout: Layout): void {
    const data = this.nodes.get(layout.id)
    if (data != null) {
      this.root = data
    } else {
      const node = new Node(layout)
      this.nodes.set(node.id, node)
      this.root = node
    }
    range(100).forEach(_ => {
      explore(this.nodes, this.root, maxRound)
    })
  }

  getWorker (): Worker {
    const workerPath = path.resolve(__dirname, './worker.js')
    const worker = new Worker(workerPath)
    worker.on('message', (message: string) => {
      console.log('Main thread received:', message)
    })
    worker.on('error', (error: ErrorEvent) => {
      console.error('Worker error:', error)
    })
    worker.postMessage('Hello from the main thread!')
    return worker
  }
}
