import { Direction, MatrixEvent, MemoryStore, Room, User } from "matrix-js-sdk";
import { drizzle, ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite/next";
import migrations from "../drizzle/migrations";
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import * as schema from '../db/schema'
import { count, eq, max } from "drizzle-orm";

export class SqliteStore extends MemoryStore {

    private head: { [id: string]: number } = {}
    private db: ExpoSQLiteDatabase<typeof schema>
    private writeQueue: any[] = []
    private writing: boolean = false

    constructor(opts) {
        super(opts);

        const expo = openDatabaseSync("bpay.db");
        const db = drizzle(expo, { schema });
        this.db = db;
        const initAsync = async () => {
            try {
                await migrate(db, migrations)
                console.debug('migrate database success')
            } catch (e) {
                console.debug('migrate database:', JSON.stringify(e))
            }
            try {
                const total = await this.db.select({ count: count() }).from(schema.events)
                console.debug('test database:', total)
            } catch { }
            // this.startWriter()
        }
        initAsync()
    }

    // async startWriter() {
    //     const stmt = await this.db.prepareAsync(insertSql)
    //     setInterval(async () => {
    //         if (this.writing) {
    //             return
    //         }
    //         this.writing = true
    //         console.debug('consume writerQueue:', this.writeQueue.length)
    //         let item
    //         try {
    //             while (this.writeQueue.length > 0) {
    //                 item = this.writeQueue.shift()
    //                 const res = await stmt.executeAsync(item)
    //             }
    //         } catch (err) {
    //             console.error('execute writer:', JSON.stringify(err), item)
    //         } finally {
    //             this.writing = false

    //         }
    //     }, 5000)
    // }

    scrollback(room: Room, limit: number): MatrixEvent[] {
        if (!this.head[room.roomId]) {
            this.db.select({ value: max(schema.events.origin_server_ts) })
                .from(schema.events)
                .where(eq(schema.events.room_id, room.roomId))
                .then(res => {
                    console.log('maxts', res.value)
                })
        }
        // // const stmt = this.db.prepareSync(scrollbackSql)
        // return []
        // this.db.query.events.findMany({where: and(eq(schema.events.room_id, room.roomId), })
        return []
    }

    async persistEvent(event: MatrixEvent) {
        try {
            await this.db.insert(schema.events).values({
                event_id: event.getId(),
                type: event.getType(),
                room_id: event.getRoomId(),
                content: event.getContent(),
                origin_server_ts: new Date(event.event.origin_server_ts || 0),
                sender: event.getSender(),
                state_key: event.getStateKey(),
                txn_id: event.getTxnId(),
                membership: event.event.membership || '',
                unsigned: event.getUnsigned(),
                redacts: event.event.redacts || ''
            }).onConflictDoNothing()
        } catch (e) {
            console.error('persistEvent', JSON.stringify(e))
        }
    }


    // async hasEvent(eventId: string) {
    //     const stmt = await this.db.prepareAsync(eventExistsSql)
    //     const result = await stmt.executeAsync<{ total: number }>({ $event_id: eventId })
    //     const row = await result.getFirstAsync()
    //     console.log('test event', row.total > 0)
    //     return row.total > 0
    // }
}