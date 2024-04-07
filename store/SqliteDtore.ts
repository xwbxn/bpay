import { MatrixEvent, MemoryStore, Room } from "matrix-js-sdk";

export class SqliteStore extends MemoryStore {

    constructor(opts) {
        super(opts);
    }

    storeEvents(room: Room, events: MatrixEvent[], token: string, toStart: boolean): void {
        console.log('room.name', room.name, events.length, token, toStart)
    }

}