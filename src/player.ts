import { v4 as uuid } from 'uuid'

export type PlayerId = string

export interface GameParticipant {
  joinedAt: Date,
  leftAt: Date | null,
  name: string,
  playerId: PlayerId,
}

export type PlayerPool = Record<PlayerId, GameParticipant>
  