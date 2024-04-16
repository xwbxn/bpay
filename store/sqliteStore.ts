import { IContent, MatrixEvent, MemoryStore, Room, RoomEvent } from "matrix-js-sdk";
import { drizzle, ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite/next";
import migrations from "../drizzle/migrations";
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import * as schema from '../db/schema'
import { and, count, desc, eq, lt, max } from "drizzle-orm";
import { sleep } from "matrix-js-sdk/lib/utils";

const SCROLLBACK_DELAY_MS = 3000;
export class SqliteStore extends MemoryStore {

    public cursor: { [id: string]: Date } = {}
    private db: ExpoSQLiteDatabase<typeof schema>
    protected ongoingScrollbacks: { [roomId: string]: { promise?: Promise<Room>; errorTs?: number } } = {};

    constructor(opts) {
        super(opts);
        const { name } = opts
        const expo = openDatabaseSync(`${name}.db`);
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

    scrollbackFromDB(room: Room, limit: number): Promise<Room> {
        let timeToWaitMs = 0;

        let info = this.ongoingScrollbacks[room.roomId] || {};
        if (info.promise) {
            return info.promise;
        } else if (info.errorTs) {
            const timeWaitedMs = Date.now() - info.errorTs;
            timeToWaitMs = Math.max(SCROLLBACK_DELAY_MS - timeWaitedMs, 0);
        }

        if (this.cursor[room.roomId].getMilliseconds() === 0) {
            return Promise.resolve(room); // already at the start.
        }

        const promise = new Promise<Room>((resolve, reject) => {
            // wait for a time before doing this request
            // (which may be 0 in order not to special case the code paths)
            sleep(timeToWaitMs)
                .then(() => {
                    return this.db.query.events.findMany({
                        where: and(eq(schema.events.room_id, room.roomId), lt(schema.events.origin_server_ts, this.cursor[room.roomId])),
                        limit: limit,
                        orderBy: desc(schema.events.origin_server_ts)
                    })
                })
                .then((page) => {
                    console.debug('scrollbackFromDB', room.roomId, page.length, this.cursor[room.roomId])
                    const cursor = page.length > 0 ? page[page.length - 1].origin_server_ts : new Date(0)
                    this.cursor[room.roomId] = cursor
                    page.forEach(e => {
                        room.getLiveTimeline().addEvent(new MatrixEvent({
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
                        }), { toStartOfTimeline: true })
                    })
                    delete this.ongoingScrollbacks[room.roomId];
                    room.emit(RoomEvent.TimelineRefresh, room, room.getUnfilteredTimelineSet())
                    resolve(room);
                })
                .catch((err) => {
                    this.ongoingScrollbacks[room.roomId] = {
                        errorTs: Date.now(),
                    };
                    reject(err);
                });
        });

        info = { promise };

        this.ongoingScrollbacks[room.roomId] = info;
        return promise;
    }

    async preloadPage(room: Room) {
        const res = await this.db.select({ value: max(schema.events.origin_server_ts) })
            .from(schema.events)
            .where(eq(schema.events.room_id, room.roomId))
        let cursor = res[0]?.value || new Date(2099, 12, 31)
        let active = new Date(room.getLiveTimeline().getEvents()[0]?.event.origin_server_ts || 0)
        while (active > cursor) {
            const r = await this.scrollback(room, 30)
            active = new Date(room.getLiveTimeline().getEvents()[0]?.event.origin_server_ts)
        }
        this.cursor[room.roomId] = cursor > active ? active : cursor
    }

    async getEvent(eventId: string) {
        return await this.db.query.events.findFirst({
            where: eq(schema.events.event_id, eventId)
        })
    }

    async persistEvent(event: MatrixEvent, local_content?: IContent) {
        try {
            const exists = await this.getEvent(event.getId())
            if (exists) {
                Object.assign(event.event.content, { ...(exists.content) as object })
                return
            }
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
            console.warn('persistEvent', JSON.stringify(e), event.getId())
        }
    }
}