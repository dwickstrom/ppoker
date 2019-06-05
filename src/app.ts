import { Games } from './game'
import * as handle from './event'
import { Socket } from 'socket.io';
import { Connections } from './connection';

export interface AppState {
    games: Games,
    connections: Connections,
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
        :   event.label === 'ClientDisconnected'   ? handle.clientDisconnected(event, socket)(appState)    
        :   event.label === 'PlayerJoinedGame'     ? handle.playerJoinedGame(event, socket)(appState)
        :   event.label === 'PlayerVoted'          ? handle.playerVoted(event, socket)(appState)
        :   /* otherwise */                          handle.theUnknown(event, socket)(appState)

export const initApp = (initialState: AppState) => {
    const app: App = {
        state: [initialState],
        handleEvent: (socket: Socket) => (event: handle._Event): AppState[] => {
            let nextState = eventHandler(socket, app.state, event)
            app.setState(nextState)    
            return app.state
        },
        setState: (next: AppState[]) => { app.state = next },
        getState: () => app.state,
    }
    return app
}
