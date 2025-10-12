export function range (a: number, b?: number): number[] {
  if (b == null) return range(0, a - 1)
  return [...Array(b - a + 1).keys()].map(i => a + i)
}

export function randInt (min: number, max: number): number {
  const a = Math.ceil(min)
  const b = Math.floor(max)
  return Math.floor(Math.random() * (b - a + 1) + a)
}

export function sample<T> (options: T[]): T {
  return options[Math.floor(Math.random() * options.length)]
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

export function clamp (a: number, b: number, x: number): number {
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

export function rotate (vector: Vec2, origin: Vec2, qTurns: number): Vec2 {
  const x0 = vector.x - origin.x
  const y0 = vector.y - origin.y
  const angle = 0.5 * Math.PI * qTurns
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const x1 = x0 * cos - y0 * sin
  const y1 = x0 * sin + y0 * cos
  return {
    x: Math.round(origin.x + x1),
    y: Math.round(origin.y + y1)
  }
}
