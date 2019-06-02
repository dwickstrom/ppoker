import { Value } from '../game'
import { fromEvent, Observable } from 'rxjs'
import { filter, takeUntil, map } from 'rxjs/operators'
import { Key } from 'readline'
const readline = require('readline')

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
readline.emitKeypressEvents(process.stdin)
process.stdin.setRawMode(true)

const keyboardEvent$: Observable<Key> = fromEvent(process.stdin, 'keypress').pipe(
    map((e: [string, Key]) => e[1]))

const ctrlC$: Observable<Key> = keyboardEvent$.pipe(
    filter((k: Key) => k.name === 'c' && k.ctrl))

const input$ = keyboardEvent$.pipe(    
    filter((k: Key) => k.name in score),
    takeUntil(ctrlC$))

export const vote$ =
    input$.pipe(map((k: Key) => score[k.name]))
