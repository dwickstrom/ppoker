import { Value } from '../game';
import { _Client } from './client';
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

export const listenForVotes = (client: _Client) => {    
    readline.emitKeypressEvents(process.stdin)
    process.stdin.setRawMode(true)
    process.stdin.on('keypress', (_, key) => {
        key.name in score && client.emitVote(score[key.name])                         
            
        // CTRL+C
        if (key.name === 'c' && key.ctrl) {
            throw Error('Quit.')
        }
    })        
}