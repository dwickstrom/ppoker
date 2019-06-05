import { Value } from '../game'
import { Observable, fromEvent } from 'rxjs'
import { filter, takeUntil, map } from 'rxjs/operators'
import { emitKeypressEvents, Key } from 'readline'

const score: Record<string, Value> = {
    q: 0,
    w: 0.5,
    e: 1,
    r: 2,
    t: 3,
    a: 5,
    s: 8,
    d: 13,
    f: 20,
    g: 40,
    z: 100,
}

process.stdin && process.stdin.setRawMode && process.stdin.setRawMode(true)
emitKeypressEvents(process.stdin)
const keypress$ = 
    fromEvent(process.stdin, 'keypress').pipe(
        map(([_, k]) => k))

const ctrlC$ = keypress$.pipe(
    filter((k: Key) => k.ctrl === true && k.name === 'c'))

export const value$: Observable<Value> =
    keypress$.pipe(
        filter((k: Key) => Object.keys(score).includes(k.name || '')),
        map((k: Key) => score[k.name || '']),
        takeUntil(ctrlC$))
