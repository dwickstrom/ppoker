import { Server } from 'http'
import { AppState, App } from './app'
const io = require('socket.io')
import { merge, interval, of, fromEvent, Observable } from 'rxjs'
import { map, mergeMap, tap, takeWhile } from 'rxjs/operators'
import { Socket } from 'socket.io';
import { Event, _Event } from './event';
import { prop } from 'ramda';
import { toLast, toList, latestFrom } from './utils';
import { _GameState, GameStateLabel } from './game';

// io$ :: Server -> Observable Socket
const io$ = (server: Server): Observable<Socket> => 
  of(io).pipe(
    map(io => io(server)))

const ticker$ = 
  interval(2000).pipe(map(() => 
    Event('TimeElapsed', null)))

const connect$ =
  (connection: any) => // <-- TODO: remove "any"
    merge(
      of(Event('ClientConnected', {connection})),  // <-- player connection events
      fromEvent(connection, 'event'),              // <-- all other player events
      fromEvent(connection, 'disconnect').pipe(    // <-- player disconnection events
        map(reason => Event('ClientDisconnected', {reason, connection}))))

// event$ :: Socket -> Observable Event
const event$ = 
  (socket: Socket) => 
    fromEvent(socket, 'connection').pipe( 
      mergeMap((connection: any) =>
        merge(connect$(connection), ticker$))) // <-- merge with tick stream emitter


const aliveStates: GameStateLabel[] = 
  [ 'initialized'
  , 'started'
  , 'abandoned'
  ]

// state$ :: App -> Socket -> Observable AppState
const state$ = 
  (app: App) => 
    (socket: Socket) =>       
      event$(socket).pipe(
        map(app.handleEvent(socket)),
        // distinctUntilChanged(),
        tap((currentState: AppState[]) => socket.emit('state', [currentState[currentState.length-1]])),
        takeWhile((s: AppState[]) => aliveStates.includes(currentGameState(s).label)))


export const currentGameState = 
  (buffer: AppState[]): _GameState =>
    latestFrom(buffer)
      .map(prop('games'))
      .flatMap(toList)
      .flatMap(prop('state'))
      .reduce(toLast)

export const initState$ =
  (app: App, server: Server) => 
    io$(server).pipe(mergeMap(state$(app)))
