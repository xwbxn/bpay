import { Direction, MatrixEvent, MemoryStore, Room, RoomEvent, User } from "matrix-js-sdk";
import { drizzle, ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite/next";
import migrations from "../drizzle/migrations";
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import * as schema from '../db/schema'
import { and, count, desc, eq, lt, max } from "drizzle-orm";

export class SqliteStore extends MemoryStore {

    private head: { [id: string]: Date } = {}
    private preLoad: {
        [id: string]: {
            items: {
                event_id: string;
                type: string;
                room_id: string;
                content: unknown;
                origin_server_ts: Date;
                sender: string;
                state_key: string;
                txn_id: string;
                membership: string;
                unsigned: unknown;
                redacts: string;
            }[], isRunning: boolean
        }
    } = {}
    private db: ExpoSQLiteDatabase<typeof schema>

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
        }
        initAsync()
    }

    scrollback(room: Room, limit: number): MatrixEvent[] {
        if (this.preLoad[room.roomId] && this.preLoad[room.roomId].isRunning) {
            return []
        }
        const pages = this.preLoad[room.roomId].items
        this.preLoad[room.roomId].items = []
        console.debug('scorllback:', room.roomId, pages.length, this.head[room.roomId])

        const events = pages.map(e => new MatrixEvent({
            event_id: e.event_id,
            sender: e.sender,
            room_id: e.room_id,
            origin_server_ts: e.origin_server_ts.getUTCMilliseconds(),
            state_key: e.state_key,
            content: e.content,
            type: e.type,
            txn_id: e.txn_id,
            membership: e.membership,
            unsigned: e.unsigned,
            redacts: e.redacts
        }))
        events.forEach(e => {
            room.getLiveTimeline().addEvent(e, { toStartOfTimeline: true })
        })
        this.preloadPage(room)
        room.emit(RoomEvent.TimelineRefresh, room, room.getUnfilteredTimelineSet())
        return events
    }

    async preloadPage(room: Room) {
        this.preLoad[room.roomId] = {
            isRunning: true,
            items: []
        }

        if (!this.head[room.roomId]) {
            this.head[room.roomId] = new Date(room.getLiveTimeline().getEvents()[0]?.event.origin_server_ts) || new Date()
        }

        if (this.preLoad[room.roomId] && this.preLoad[room.roomId].isRunning) {
            return
        }
        const page = await this.db.query.events.findMany({
            where: and(eq(schema.events.room_id, room.roomId), lt(schema.events.origin_server_ts, this.head[room.roomId])),
            limit: 30,
            orderBy: desc(schema.events.origin_server_ts)
        })

        this.head[room.roomId] = page.length > 0 ? page[page.length - 1].origin_server_ts : new Date(0)

        console.debug('preloadPage', room.roomId, page.length, this.head[room.roomId])
        this.preLoad[room.roomId] = {
            isRunning: false,
            items: page
        }
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
}