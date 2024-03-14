import { openDatabaseSync } from "expo-sqlite/next"
import { drizzle, ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";

import { IOpts, MatrixClient, MatrixEvent, MemoryStore, Room, User } from "matrix-js-sdk"
import * as schema from './schema';

export class SqliteStore extends MemoryStore {

    private db: ExpoSQLiteDatabase<typeof schema>

    constructor(dbname, opts: IOpts = {}) {
        super(opts)
        const expo = openDatabaseSync(dbname)
        this.db = drizzle(expo, { schema })
        this.loadEvents()
    }

    loadEvents() {

    }

    storeEvents(room: Room, events: MatrixEvent[], token: string, toStart: boolean): void {
        super.storeEvents(room, events, token, toStart)
    }

    scrollback(room: Room, limit: number): MatrixEvent[] {
        return super.scrollback(room, limit)
    }
}