import { parentPort } from 'node:worker_threads'

console.log('Worker Started')

parentPort?.on('message', (message) => {
  console.log('Worker thread received:', message)
  parentPort?.postMessage('Hello from the worker thread!')
})
