export type PlayerId = string

export interface GameParticipant {
    readonly joinedAt: Date,
    readonly leftAt: Date | null,
    readonly name: string,
    readonly playerId: PlayerId,
}

export type PlayerPool = Record<PlayerId, GameParticipant>
  