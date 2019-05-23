import { Event, _Event } from "../event";
import { AppState } from "../app";
const chalk = require('chalk')
import { last, prop } from "ramda";
import { latestFrom, UUID, toList, toLast, die } from "../utils";
import { Socket } from "socket.io";
import { Value, _Game, _Vote, Vote, _GameState, GameStateLabel } from "../game";
import { listenForVotes } from "./input";
const io = require('socket.io-client')
import * as Vorpal from 'vorpal'
import { gamePage } from "./template";
import { _Player, GameParticipant, PlayerId } from "../player";


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
  console.clear()
  const latest: AppState = last(state)  
  const games: Record<string, _Game> = latest.games  
  
  const votes: _Vote[] = 
    toList(games)
      .flatMap(g => g.votes)
  
  const playerResults: ResultPair[] =
    toList(games)
      .map(prop('players'))
      .flatMap(toList)
      .filter((player: GameParticipant) => player.leftAt === null)
      .map((player: GameParticipant): ResultPair => [
        player.name, 
        votes
          .filter((v: _Vote) => v.playerId === player.playerId)
      ])

  const description: string = 
    toList(games)
      .map(prop('description'))
      .reduce(toLast, '')
  
  const gameState: GameStateLabel = 
    toList(games)
      .reduce(toLast)
      .state.map(prop('label'))
            .reduce(toLast)

  ui.redraw(
    chalk.yellow(gamePage({
      votes: playerResults, 
      description, 
      gameState, 
      me: playerId
    })))
}

const getGame = (state: AppState[]):_Game =>
  latestFrom(state)
    .map(prop('games'))
    .flatMap(toList)
    .reduce(toLast)

export interface _Client {
  redraw: (() => void),
  emitVote: ((v: Value) => void),
  getState: (() => AppState[]),  
  setState: ((next: AppState[]) => void),  
  getSocket: (() => Socket),
  setSocket: ((s: Socket) => void),  
}

const Client = (gameId: UUID, playerName: string): _Client => {
  let vorpal = new Vorpal()
  let state: any = {}
  let _socket: Socket | null = null
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
      _socket.emit('event', 
                   Event('PlayerVoted', { vote: Vote(_socket.id
                                        , value
                                        , getGame(state).id)
                                        , connectionId: _socket.id })),      
    setSocket: (socket: Socket) => {      
      _socket = socket      
      socket.emit('event', 
                  Event('PlayerJoinedGame', { gameId
                                            , playerId: socket.id
                                            , name: playerName }))
    },
    getSocket: () => _socket,
  }
  
  listenForVotes(client)

  return client
}

export const joinGame = (gameId: UUID, addr: string, playerName: string) => {
  const client = Client(gameId, playerName)
  
  const socket = io(addr)

  socket.on('connect', () => {      
    client.setSocket(socket)
    socket.on('state', (state: AppState[]) => client.setState(state))
    socket.on('disconnect', die('\n 🎮  ' + chalk.magenta('Game over') + '\n'))
    socket.on('error', (err: any) => {
      console.log(' 💥  ' + chalk.red(err.toString()) + '\n')
      process.exit()
    })
  })
}
