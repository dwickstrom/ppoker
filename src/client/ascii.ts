import { GameStateLabel, _Vote } from "../game";
import { PlayerId } from "../player";
import { snd, fst } from "../utils";
import { ResultPair } from "./client";
import { prop } from "ramda";

export const asciiTable = (results: ResultPair[], gameState: GameStateLabel[], me: PlayerId): string =>
  results.reduce((acc: string, result: ResultPair) => 
    `${acc}\n${createRow(result, gameState, me, results)}`, 
        results.length ? '\n' + createCellBorder(results[0]) : '')

const createLine = (n: number) =>
  '+' + Array(n).fill('-').join('')

const createCellBorder = (data: any) =>
  Array(data.length)
    .fill('.')
    .map((_, i) => data[i])
    .map((word) => createLine(word.length).padEnd(25, '-'))
    .join('') + '+'

const createRow = (result: ResultPair, gameState: GameStateLabel[], me: PlayerId, results: ResultPair[]) => 
`│ ${fst(result).padEnd(22)} │ ${maskValue(gameState, snd(result), me, results).toString().padEnd(22)} │
${createCellBorder(result)}`


const isMe = (vote: _Vote[], pid: PlayerId): boolean => 
    vote
    .map(prop('playerId'))
    .map(playerId => pid === playerId)
    .every(x => x)

export const maskValue = 
  (gameState: GameStateLabel[], vote: _Vote[], me: PlayerId, results: ResultPair[]): string[] => {
    // User can always see its own vote on its own screen
    // Everyone can see every result once the game is complete
    if (isMe(vote, me) || gameState.map(l => l === 'completed').some(x => x)) {
      return vote.map(prop('value')).map(x => x.toString())
    }
      
    // Everyone else gets a *** placeholder once I have cast my vote
    return vote
      .map(prop('playerId'))
      .map(pid => 
        results
        .flatMap(snd)
        .map(prop('playerId'))
        .includes(pid))
            .some(x => x)
            ? ['***']
            : ['']
  }
