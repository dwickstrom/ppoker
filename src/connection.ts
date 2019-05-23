import { UUID } from "./utils";

export interface Connection {
    connectionId: string,
    userId: UUID,
}

export type Connections = Record<string, Connection>
