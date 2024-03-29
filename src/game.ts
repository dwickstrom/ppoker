import { UUID, now, toList, lastFrom } from "./utils";
import { PlayerPool, PlayerId } from "./player";
import { set, lensPath, prop } from "ramda";
import { v4 as uuid } from 'uuid'
import { AppState } from "./app";

export type Value = 0 | 0.5 | 1 | 2| 3 | 5 | 8 | 13 | 20 | 40 | 100

export interface _Vote {
  readonly value: Value,
  readonly castOn: Date,
  readonly playerId: PlayerId,
  readonly gameId: UUID
}

export const Vote = 
  (playerId: PlayerId, value: Value, gameId: UUID): Readonly<_Vote> => 
    ({
      castOn: now(),
      playerId,
      value,
      gameId
    })

export type GameStateLabel =
  | "initialized"
  | "started"
  | "completed"
  | "aborted"
  | "expired"
  | "abandoned"

export interface _GameState {
  readonly label: GameStateLabel,
  readonly observedAt: Date,
}

export const GameState =
  (label: GameStateLabel): Readonly<_GameState> =>
    ({label, observedAt: now()})

export interface _Game {
  readonly id: UUID,
  readonly description: string,
  readonly players: PlayerPool,
  readonly votes: _Vote[],
  readonly state: _GameState[],
}

export type Games = Record<UUID, _Game>

export const Game =
  (description: string, players: PlayerPool): Readonly<_Game> =>
    ({
      id: uuid(),
      description,
      players,
      votes: [],
      state: [GameState('initialized')]
    })

export const getGames = 
  (state: AppState[]): Record<string, _Game>[] =>
    lastFrom(state)
      .map(prop('games'))
  
export const getGame = (state: AppState[]): _Game[] =>
  getGames(state)
    .map(toList)
    .flatMap(lastFrom)

export const leaveAllGames =
  (playerId: PlayerId) =>
    (games: Games): Games => {
      return Object.keys(games).reduce((acc, gid) => {
        let playerLens = lensPath([playerId, 'leftAt'])
        
        let nextPlayers = 
             Object.keys(games[gid].players).length 
          && Object.keys(games[gid].players).includes(playerId)
              ? set(playerLens, now(), games[gid].players)
              : games[gid].players

        return {
          ...acc, 
          [gid]: {
            ...games[gid], 
            players: nextPlayers,
            state: isAbandoned(nextPlayers) && ['initialized', 'started'].includes(games[gid].state[games[gid].state.length - 1].label)
                    ? [...games[gid].state, {label: 'abandoned', observedAt: now()}]
                    : games[gid].state
          }
        }
      }, {})
    }
        
const GAME_TIMEOUT_IN_MINUTES = 10

const isStale = (game: _Game) =>
  game.state
    .map(prop('observedAt'))
    .map(o => +now() - +o)
    .every(diff => diff > GAME_TIMEOUT_IN_MINUTES * 1000 * 60)


export const removeStale = 
  (games: Games): Games =>
    Object.keys(games)
    .reduce((acc, id) => 
      isStale(games[id]) 
      ? acc 
      : ({...acc, [id]: games[id]})
    , {})

const currentStateLabelFrom = 
  (game: _Game): GameStateLabel[] =>
    lastFrom(game.state)
      .map(prop('label'))

export const canVote = 
  (playerId: PlayerId) =>
    (game: _Game): boolean => 
         Object.keys(game.players).includes(playerId) // Player has joined this game
      && Array.of<GameStateLabel>('initialized', 'started')
          .map(validLabel => currentStateLabelFrom(game).includes(validLabel))
          .some(x => x) // Game is in valid state

export const isAbandoned = 
  (players: PlayerPool): boolean =>
       Object.keys(players).length === 0
    || Object.keys(players)
         .map(pid => players[pid])
         .every(p => p.leftAt !== null)

const everyoneHasVoted = 
  (game: _Game) =>
       game.votes.length === toList(game.players).filter(p => p.leftAt === null).length
    && toList(game.players).length > 1
        
const updateGameState =
  (game: _Game): _GameState[] => {
    let latestGameState = lastFrom(game.state)

    if (latestGameState.length && latestGameState[0].label === 'initialized') {
      return [...game.state, {label: 'started', observedAt: now()}]
    }
    
    if (latestGameState.length && latestGameState[0].label === 'started' && everyoneHasVoted(game)) {
      return [...game.state, {label: 'completed', observedAt: now()}]
    }

    return game.state
  }
  
export const addVote = 
  (vote: _Vote) => 
    (game: _Game): _Game => {
      if (vote.gameId === game.id && canVote(vote.playerId)(game)) {
        let nextGame = {
          ...game, 
          votes: [...game.votes.filter(v => v.playerId !== vote.playerId), vote],           
        }
        return {
          ...nextGame,
          state: updateGameState(nextGame)
        }
      }
      return game
    }
