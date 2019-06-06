import { UUID } from "./utils";

export interface _Connection {
    connectionId: string,
    userId: UUID,
}

export const Connection = 
    (connectionId: string, userId: UUID): Readonly<_Connection> =>
        ({connectionId, userId})

export type Connections = Record<string, _Connection>
