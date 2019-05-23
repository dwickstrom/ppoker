import { Games } from './game'
import * as handle from './event'
import { Socket } from 'socket.io';
import { _Player, RegisteredPlayers } from './player';
import { Connections } from './connection';

export interface AppState {
  games: Games,
  connections: Connections,
  role: any,
  serverTime: Date,
  players: RegisteredPlayers,
}

export interface App {
  state: AppState[],
  handleEvent: ((socket: Socket) => (event: handle._Event) => AppState[]),
  setState: ((state: AppState[]) => void),
  getState: (() => AppState[]),
}

const eventHandler =
  (socket: Socket,appState: AppState[], event: handle._Event): AppState[] =>
      event.label === 'ClientConnected'      ? handle.clientConnected(event, socket)(appState)
    : event.label === 'ClientDisconnected'   ? handle.clientDisconnected(event, socket)(appState)    
    : event.label === 'PlayerJoinedGame'     ? handle.playerJoinedGame(event, socket)(appState)
    : event.label === 'PlayerVoted'          ? handle.playerVoted(event, socket)(appState)
    // : event.label === 'TimeElapsed'          ? handle.timeElapsed(event)(appState)
    // : event.label === 'PlayerRegistered'     ? handle.playerRegistered(event)(appState)
    // : event.label === 'PlayerStartedGame'    ? handle.playerStartedGame(event)(appState)
    : /* otherwise */                          handle.theUnknown(event, socket)(appState)

export const initApp = (initialState: AppState) => {

  const app: App = {
    state: [initialState],
    handleEvent: null,
    setState: null,
    getState: null,
  }

  app.setState = (next: AppState[]) => { app.state = next }
  
  app.getState = () => app.state

  app.handleEvent = (socket: Socket) => (event: handle._Event): AppState[] => {
    let nextState = eventHandler(socket, app.state, event)
    app.setState(nextState)

    return app.state
  }

  return app
}
