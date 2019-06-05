import { AppState } from './app'
import { lastFrom, now, Index } from './utils';
import { PlayerId } from './player';
import { _Game, leaveAllGames, removeStale, _Vote, addVote } from './game';
import { Socket } from 'socket.io';

export type EventLabel =
  | 'ClientConnected'
  | 'ClientDisconnected'
  | 'PlayerRegistered'
  | 'PlayerStartedGame'
  | 'PlayerJoinedGame'
  | 'PlayerVoted'
  | 'TimeElapsed'


export type _Event = {
  label: EventLabel,
  payload: any,
}

export const Event =
  (label: EventLabel, payload: any): _Event =>
    ({label, payload})

const BUFFER_SIZE = 0;

export const appendTo =
  (buffer: AppState[]) =>
    (next: AppState): AppState[] =>
      buffer.concat(next).slice(buffer.length-BUFFER_SIZE)

export const removeById =
  (id: Index) =>
    (obj: Record<Index, any>) =>
      Object.keys(obj)
        .reduce((acc: Record<Index, any>, x: any) =>
          x === id 
          ? acc 
          : ({...acc, [x]: obj[x]}), {})

const addPlayer =
  (playerId: PlayerId, name: string) =>
    (game: _Game): _Game =>
      ({
        ...game, 
        players: {
          ...game.players, 
          [playerId]: {
            joinedAt: now(), leftAt: null, name, playerId
          }
        },
        state: game.state[game.state.length-1].label !== 'started' 
          ? [...game.state, {label: 'started', observedAt: now()}]
          : [...game.state]
      })

//------------------------------------
// AppState Reducers
//------------------------------------
type AppStateReducer = ((e: _Event, socket: Socket) => (s: AppState[]) => AppState[])

export const clientDisconnected: AppStateReducer =
  (event: _Event, _: Socket) =>
    (buffer: AppState[]) =>
      lastFrom(buffer)
        .map((latest: AppState) => ({
          ...latest,
          connections: removeById(event.payload.connection.id)(latest.connections),
          games: leaveAllGames(event.payload.connection.id)(latest.games),
        }))
        .flatMap(appendTo(buffer))

export const playerJoinedGame: AppStateReducer =
  (event: _Event, socket: Socket) =>
    (buffer: AppState[]) =>
      lastFrom(buffer)
        .map((latest: AppState) => {
          if (Object.keys(latest.games).includes(event.payload.gameId)) {
            return ({
              ...latest,
              games: {
                ...latest.games,
                [event.payload.gameId]: addPlayer(event.payload.playerId, event.payload.name)(latest.games[event.payload.gameId])
              }})
          } else {
            // No game with this id active, emit error and do nothing
            socket.emit('error', "No such game.")
            return latest
          }    
        })    
        .flatMap(appendTo(buffer))

export const timeElapsed: AppStateReducer =
  _ =>
    (buffer: AppState[]) =>
      lastFrom(buffer)
        .map((latest: AppState) => ({
          ...latest,
          games: removeStale(latest.games)
        }))
        .flatMap(appendTo(buffer))

export const playerVoted: AppStateReducer =
  (event: _Event, socket: Socket) =>
    (buffer: AppState[]) =>
      lastFrom(buffer)
        .map((latest: AppState) =>      
           ({
            ...latest,
            games: Object.keys(latest.games)
              .reduce((acc, gid) => {
                return latest.games[gid].id === event.payload.vote.gameId 
                  ? {...acc, [gid]: addVote(event.payload.vote)(latest.games[gid])}
                  : {...acc, [gid]: latest.games[gid]}
              }, {}),
          }))
        .flatMap(appendTo(buffer))

export const clientConnected: AppStateReducer =
  (event: _Event, socket: Socket) =>
    (buffer: AppState[]) =>
      lastFrom(buffer)
        .map((latest: AppState) => ({
          ...latest,
          connections: {
            ...latest.connections,
            [event.payload.connection.id]: event.payload.connection.id}}))
        .flatMap(appendTo(buffer))

export const theUnknown: AppStateReducer =
  _ => (buffer: AppState[]) => buffer
