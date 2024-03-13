import { openDatabaseSync } from "expo-sqlite/next"
import { drizzle, ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';

import { IOpts, MatrixEvent, MemoryStore, Room, User } from "matrix-js-sdk"
import migrations from "../../drizzle/migrations";
import * as schema from './schema';


export class SqliteStore extends MemoryStore {

    private db: ExpoSQLiteDatabase<typeof schema>

    constructor(dbname, opts: IOpts = {}) {
        super(opts)
        const expo = openDatabaseSync(dbname)
        this.db = drizzle(expo, { schema })
    }

    storeEvents(room: Room, events: MatrixEvent[], token: string, toStart: boolean): void {
        super.storeEvents(room, events, token, toStart)
    }

    storeRoom(room: Room): void {
        console.log('store room', room.roomId, room.tags, room.normalizedName, room.summary)
        this.db.insert(schema.rooms).values({
            roomId: room.roomId,
            name: room.name,
            normalizedName: room.normalizedName,
            tags: room.tags
        }).then(res => {
            console.log('store', res)
        })
        super.storeRoom(room)
    }

    storeUser(user: User): void {
        super.storeUser(user)
    }

    getRoom(roomId: string): Room {
        return super.getRoom(roomId)
    }

    getRooms(): Room[] {
        this.db.query.rooms.findMany().then(res => {
            console.log('res', res)
        })
        return super.getRooms()
    }

    getUser(userId: string): User {
        return super.getUser(userId)
    }

    getUsers(): User[] {
        return super.getUsers()
    }

    scrollback(room: Room, limit: number): MatrixEvent[] {
        return super.scrollback(room, limit)
    }
}