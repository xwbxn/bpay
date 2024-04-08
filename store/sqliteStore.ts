import { Direction, MatrixEvent, MemoryStore, Room, User } from "matrix-js-sdk";
import * as SQLite from 'expo-sqlite/next';

const initSql = `CREATE TABLE "events" (
    "event_id" text(256) NOT NULL,
    "type" text(256),
    "room_id" text(256),
    "content" text(4096),
    "origin_server_ts" integer,
    "sender" TEXT(256),
    "state_key" TEXT(256),
    "txn_id" text(256),
    "membership" text(256),
    "unsigned" text(4096),
    "redacts" text(256),
    PRIMARY KEY ("event_id")
  );
  
  CREATE INDEX "idx_events_room_ts"
  ON "events" (
    "room_id" ASC,
    "origin_server_ts" DESC
  );`

const insertSql = `INSERT INTO "events" (event_id, type, room_id, content, origin_server_ts, sender, state_key, txn_id, membership, unsigned, redacts) 
    VALUES ($event_id, $type, $room_id, $content, $origin_server_ts, $sender, $state_key, $txn_id, $membership, $unsigned, $redacts);`

export class SqliteStore extends MemoryStore {

    private head: Map<string, number>
    private readupTo: Map<string, string>
    private preLoadCache: Map<string, MatrixEvent[]>
    private db: SQLite.SQLiteDatabase
    private writeQueue: any[] = []
    private writing: boolean = false

    constructor(opts) {
        super(opts);
        this.db = SQLite.openDatabaseSync('chatdb');
        const initAsync = async () => {
            try {
                await this.db.execAsync(initSql)
            } catch (e) {
                console.debug('create database:', JSON.stringify(e))
            }
            try {
                const res = await this.db.getFirstAsync("select count(*) from events")
                console.debug('test database:', JSON.stringify(res))
            } catch { }
            this.startWriter()
        }
        initAsync()
    }

    async startWriter() {
        const stmt = await this.db.prepareAsync(insertSql)
        setInterval(async () => {
            if (this.writing) {
                return
            }
            this.writing = true
            console.debug('consume writerQueue:', this.writeQueue)
            try {
                for (let index = 0; index < this.writeQueue.length; index++) {
                    const element = this.writeQueue[index];
                    const res = await stmt.executeAsync(element)
                    console.debug('execute writer:', JSON.stringify(res), element)
                }
                this.writeQueue = []
            } catch (err) {
                console.error('execute writer:', JSON.stringify(err))
            } finally {
                this.writing = false

            }
        }, 2000)
    }

    async preLoadPage(roomId: string) {
        // const sql = "select * from events where origin_server_ts < ? order by origin_server_ts limit 30"
        // const data = await this.db.execAsync([{ sql, args: [this.head[roomId]] }], true)
    }

    scrollback(room: Room, limit: number): MatrixEvent[] {
        const readupTo = room.getReadReceiptForUserId(room.myUserId).eventId
        if (!this.hasEvent(readupTo)) {
            return []
        } else {
            const page = [...this.preLoadCache[room.roomId]]
            this.preLoadPage(room.roomId)
            return page
        }
    }

    storeEvents(room: Room, events: MatrixEvent[], token: string, toStart: boolean): void {
        //(event_id, type, room_id, content, origin_server_ts, sender, state_key, txn_id, membership, unsigned, redacts)
        events.forEach(e => {
            this.writeQueue.push({
                $event_id: e.getId(),
                $type: e.getType(),
                $roomId: e.getRoomId(),
                $content: JSON.stringify(e.getContent()),
                $origin_server_ts: e.event.origin_server_ts,
                $sender: e.getSender(),
                $state_key: e.getStateKey(),
                $txn_id: e.getTxnId(),
                $membership: e.event.membership,
                $unsigned: JSON.stringify(e.getUnsigned()),
                $redacts: e.event.redacts
            })
        })
        console.debug('store event:', events.length)
    }

    wantsSave(): boolean {
        console.debug('wantsSave')
        return true
    }

    save(force: boolean): Promise<void> {
        return Promise.resolve()
    }

    hasEvent(eventId: string): boolean {
        return false
    }
}