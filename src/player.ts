import { v4 as uuid } from 'uuid'

export type PlayerId = string

export interface _Player {
  name: string,
  id: string,
  connectionId: string,
}

export interface GameParticipant {
  joinedAt: Date,
  leftAt: Date | null,
  name: string,
  playerId: PlayerId,
}

export type PlayerPool = Record<PlayerId, GameParticipant>

export type RegisteredPlayers = Record<PlayerId, _Player>

export const Player =
  (name: string, connectionId: string): _Player =>
    ({name, id: uuid(), connectionId})
  