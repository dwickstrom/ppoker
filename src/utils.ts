export type UUID = string

export type Index = string | number | symbol

export const die =
  (message: string) =>
    () => {
      console.log(message)
      process.exit()
    }

export const lastFrom = <T>(list: T[]): T[] =>
  list.length > 0
    ? [list[list.length-1]]
    : []

export const firstFrom = <T>(list: T[]): T[] =>
    list.length > 0
      ? [list[0]]
      : []

export const now = () => new Date()

export const toList = 
  <V>(obj: Record<Index, V>): V[] =>
    Object.keys(obj).map(k => obj[k])

export const fst =
    <T, _>(pair: [T, _]): T =>
      pair[0]

export const snd =
  <_, U>(pair: [_, U]): U =>
    pair[1]

export const raise = 
  (err: any): never => { throw err }

export const removeKey =
  (id: Index) =>
    (obj: Record<Index, any>): Record<Index, any> =>
      Object.keys(obj)
        .reduce((acc: Record<Index, any>, x: any) =>
          x === id 
          ? acc 
          : ({...acc, [x]: obj[x]}), {})

export const avg = 
  (ns: number[]): number =>
    ns.reduce((x, y) => x + y, 0) / ns.length

export const median = (ns: number[]): number => {
  const mid = Math.floor(ns.length / 2)
  const nums = [...ns].sort((a, b) => a - b)
  return ns.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2
}