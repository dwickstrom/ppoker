import { Server } from 'http'
import { AppState, App } from './app'
const io = require('socket.io')
import { merge, interval, of, fromEvent, Observable } from 'rxjs'
import { map, mergeMap, takeWhile, catchError } from 'rxjs/operators'
import { Socket, EngineSocket } from 'socket.io';
import { Event, _Event } from './event';
import { prop } from 'ramda';
import { toList, lastFrom, raise } from './utils';
import { _GameState, GameStateLabel } from './game';
  

const ticker$ = 
  interval(2000).pipe(map(() => 
    Event('TimeElapsed', null)))

const clientEvent$ = (connection: EngineSocket): Observable<_Event> =>
  fromEvent(connection, 'event')

const connection$ =
  (connection: EngineSocket) => // <-- TODO: remove "any"
    merge(
      of(Event('ClientConnected', {connection})),  // <-- player connection events
      clientEvent$(connection),                    // <-- all other player events
      fromEvent(connection, 'disconnect').pipe(    // <-- player disconnection events
        map(reason => Event('ClientDisconnected', {reason, connection}))))

const event$ = 
  (socket: Socket): Observable<_Event> => 
    fromEvent(socket, 'connection').pipe( 
      mergeMap((connection: EngineSocket) =>
        merge(connection$(connection), ticker$))) // <-- merge with tick stream emitter


const aliveStates: GameStateLabel[] = 
  [ 'initialized'
  , 'started'
  , 'abandoned'
  ]

const emitState = 
  (socket: Socket, state: AppState[]): AppState[] =>
      socket.emit('state', state) 
      ? state 
      : raise(Error('Unable to emit.'))

const handleEmission =
  (socket: Socket) =>
    (state: AppState[]): Observable<AppState[]> =>
      of(emitState(socket, state)).pipe(
        catchError(err => {
          console.log('Error:', err)
          // TODO: handle error here
          throw err
        })
      )

const state$ = 
  (app: App) => 
    (socket: Socket): Observable<AppState[]> =>       
      event$(socket).pipe(
        map(app.handleEvent(socket)),
        // distinctUntilChanged(),
        mergeMap(handleEmission(socket)),
        takeWhile((s: AppState[]) => 
          currentGameState(s)
            .map(prop('label'))
            .map(label => aliveStates.includes(label))
            .some(x => x)))


export const currentGameState = 
  (buffer: AppState[]): _GameState[] =>
    lastFrom(buffer)
      .map(prop('games'))
      .flatMap(toList)
      .map(prop('state'))
      .flatMap(lastFrom)

export const initState$ =
  (app: App, server: Server) => 
    of(io(server)).pipe(
      mergeMap(state$(app)))
