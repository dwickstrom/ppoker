export type UUID = string

export const die =
  (message: string) =>
    () => {
      console.log(message)
      process.exit()
    }

export const latestFrom = <T>(list: T[]): T[] =>
  list.length > 0
    ? [list[list.length-1]]
    : []

export const firstFrom = <T>(list: T[]): T[] =>
    list.length > 0
      ? [list[0]]
      : []

export const now = () => new Date()

export const toList = 
  <V>(obj: Record<string | number | symbol, V>): V[] =>
    Object.keys(obj).map(k => obj[k])

export const toLast =
  <T>(_: T, x: T) => x

export const fst =
    <T, _>(pair: [T, _]): T =>
      pair[0]

export const snd =
  <_, U>(pair: [_, U]): U =>
    pair[1]

export const avg = 
  (ns: number[]) =>
    ns.reduce((x, y) => x + y, 0) / ns.length

export const median = (ns: number[]) => {
  const mid = Math.floor(ns.length / 2)
  const nums = [...ns].sort((a, b) => a - b)
  return ns.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2
}