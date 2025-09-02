export function range (a: number, b?: number): number[] {
  if (b == null) return range(0, a - 1)
  return [...Array(b - a + 1).keys()].map(i => a + i)
}

export function sample<T> (choices: T[]): T {
  return choices[Math.floor(Math.random() * choices.length)]
}

export function sum (array: number[]): number {
  let total = 0
  array.forEach(x => { total = total + x })
  return total
}

export function product (array: number[]): number {
  let result = 1
  array.forEach(x => { result = result * x })
  return result
}

export function mean (array: number[]): number {
  if (array.length === 0) return 0
  return sum(array) / array.length
}

export function clamp (x: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, x))
}

export interface Vec2 {
  x: number
  y: number
}

export function shuffle <T> (array: T[]): T[] {
  return array
    .map(item => ({ value: item, priority: Math.random() }))
    .sort((a, b) => a.priority - b.priority)
    .map(x => x.value)
}
