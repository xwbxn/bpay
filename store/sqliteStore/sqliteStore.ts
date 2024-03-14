import { openDatabaseSync } from "expo-sqlite/next"
import { drizzle, ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";

import { IOpts, MatrixEvent, MemoryStore, Room } from "matrix-js-sdk"
import * as schema from './schema';

export class SqliteStore extends MemoryStore {

    private db: ExpoSQLiteDatabase<typeof schema>

    constructor(dbname, opts: IOpts = {}) {
        super(opts)
        const expo = openDatabaseSync(dbname)
        this.db = drizzle(expo, { schema })
    }

    storeEvents(room: Room, events: MatrixEvent[], token: string, toStart: boolean): void {
        // const insertValues = []
        // events.forEach(e => {
        //     const val = {
        //         ...e.event
        //     }
        //     insertValues.push(val)
        // })
        // this.db.insert(schema.events).values(insertValues).then(res => {
        //     console.log('store local events ', res)
        // })
        events.forEach(e => {
            console.log('ssssssssssssssssssssssssssstore event', e.getId(), e.getType(), e.getContent())
        })
        super.storeEvents(room, events, token, toStart)
    }

    scrollback(room: Room, limit: number): MatrixEvent[] {
        return super.scrollback(room, limit)
    }
}