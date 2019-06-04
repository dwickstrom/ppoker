import { Event, _Event } from "../event";
import { AppState } from "../app";
const chalk = require('chalk')
import { prop } from "ramda";
import { lastFrom, UUID, toList, die } from "../utils";
import { Socket } from "socket.io";
import { Value, _Game, _Vote, Vote, _GameState, GameStateLabel } from "../game";
const io = require('socket.io-client')
import * as Vorpal from 'vorpal'
import { gamePage } from "./template";
import { GameParticipant, PlayerId } from "../player";
import { value$ } from "./input";


/*

# List of games
+---+--------------------------------------------+-----------+
│ # │ Description                                │ # Players │
+---+--------------------------------------------+-----------+
│ 1 │ Lorem ipsum dolor sit amet                 │     0     │
+---+--------------------------------------------+-----------+
│ 2 │ Ut enim ad minim veniam                    │     0     │
+---+--------------------------------------------+-----------+
│ 3 │ Duis aute irure dolor in reprehenderit     │     0     │
+---+--------------------------------------------+-----------+
│ 4 │ Excepteur sint occaecat cupidatat non      │     0     │
+---+--------------------------------------------+-----------+


# Voting commands
+---+---+---+---+---+---+---+----+----+----+-----+
│ 0 │ ½ │ 1 │ 2 │ 3 │ 5 │ 8 │ 13 │ 20 │ 40 │ 100 │
+---+---+---+---+---+---+---+----+----+----+-----+
│ Q │ W │ E │ R │ T │ A │ S │ D  │ F  │ G  │ Z   │
+---+---+---+---+---+---+---+----+----+----+-----+

# Current game

>>> Duis aute irure dolor in reprehenderit
+---+---------+
│ David │     │
+---+---------+
│ Stina │ 8   │
+---+---------+
│ Clara │ 100 │
+---+---------+
│ Jenny │ *** │
+---+---------+

*/

type PlayerName = string

export type ResultPair = [PlayerName, _Vote[]]

const redraw = (ui: Vorpal.UI, state: AppState[], playerId: PlayerId) => {
  // console.clear()
  const games: Record<string, _Game>[] = 
    lastFrom(state)
      .map(prop('games'))
  
  const votes: _Vote[] = 
    games
      .flatMap(toList)
      .flatMap(prop('votes'))
  
  const playerResults: ResultPair[] =
    games
      .flatMap(toList)
      .map(prop('players'))
      .flatMap(toList)
      .filter((player: GameParticipant) => player.leftAt === null)
      .map((player: GameParticipant): ResultPair => [
        player.name, 
        votes
          .filter((v: _Vote) => v.playerId === player.playerId)
      ])

  const description: string[] = 
    games.map(toList)
      .flatMap(lastFrom)
      .map(prop('description'))

  
  const gameState: GameStateLabel[] = 
    games.map(toList)
      .flatMap(lastFrom)
      .map(prop('state'))
      .flatMap(lastFrom)
      .map(prop('label'))

  ui.redraw(
    chalk.yellow(gamePage({
      votes: playerResults, 
      description, 
      gameState, 
      me: playerId
    })))
}

const getGame = (state: AppState[]): _Game[] =>
  lastFrom(state)
    .map(prop('games'))
    .map(toList)
    .flatMap(lastFrom)

export interface _Client {
  redraw: (() => void),
  emitVote: ((v: Value) => void),
  getState: (() => AppState[]),  
  setState: ((next: AppState[]) => void),  
  getSocket: (() => Socket),
}

const Client = (gameId: UUID, playerName: string, socket: Socket): _Client => {
  let vorpal = new Vorpal()
  let state: any = {}
  let _socket: Socket = socket
  const client = {
    setState: (next: AppState[]) => {
      if (JSON.stringify(state) !== JSON.stringify(next)) {
        state = next  
        redraw(vorpal.ui, state, _socket.id)
      }
    },
    getState: (): AppState[] => state,
    redraw: () => redraw(vorpal.ui, state, _socket.id),
    emitVote: (value: Value) =>
      getGame(state)
        .map(({id}) => 
          _socket.emit('event', 
            Event('PlayerVoted', {
              vote: Vote(_socket.id, value, id), 
              connectionId: _socket.id })))
      ,      
    getSocket: () => _socket,
  }

  _socket.emit('event', 
                  Event('PlayerJoinedGame', { gameId
                                            , playerId: _socket.id
                                            , name: playerName }))

  value$.subscribe(
    (value: Value) => client.emitVote(value), 
    (err: any) => { console.log('Error:', err) }, 
    () => { process.exit() })

  return client
}

export const joinGame = 
  (gameId: UUID, addr: string, playerName: string) => {  
    const socket = io(addr)  

    socket.on('connect', () => {      
      const client = Client(gameId, playerName, socket)
      socket.on('state', (state: AppState[]) => client.setState(state))
      socket.on('disconnect', die('\n 🎮  ' + chalk.magenta('Game over') + '\n'))
      socket.on('error', (err: any) => {
        console.log(' 💥  ' + chalk.red(err.toString()) + '\n')
        process.exit()
      })
    })
  }
