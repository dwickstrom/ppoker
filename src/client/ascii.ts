import { GameStateLabel, _Vote } from "../game";
import { PlayerId } from "../player";
import { snd } from "../utils";
import { ResultPair } from "./client";
import { prop } from "ramda";

export const asciiTable = (results: ResultPair[], gameState: GameStateLabel[], me: PlayerId): string =>
  results.reduce((acc: string, result: ResultPair) => {    
      return `${acc}\n${createRow(result, gameState, me, results)}`
  }, results.length ? '\n' + createCellBorder(results[0]) : '')

const createLine = (n: number) =>
  '+' + Array(n).fill('.').map(() => '-').join('')

const createCellBorder = (data: any) =>
  Array(data.length)
    .fill('.')
    .map((_, i) => data[i])
    .map((word) => createLine(word.length).padEnd(25, '-'))
    .join('') + '+'

const createRow = (result: ResultPair, gameState: GameStateLabel[], me: PlayerId, results: ResultPair[]) => 
`│ ${result[0].padEnd(22)} │ ${maskValue(gameState, snd(result), me, results).toString().padEnd(22)} │
${createCellBorder(result)}`


const isMe = (val: _Vote[], pid: PlayerId) => 
     val.length
  && val[0].playerId === pid

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
