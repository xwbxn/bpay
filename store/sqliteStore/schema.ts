import { sqliteTable, text, integer, uniqueIndex, customType, blob, index } from 'drizzle-orm/sqlite-core';


export const rooms = sqliteTable('rooms', {
    roomId: text('roomId').primaryKey(),
    name: text('name').notNull(),
    normalizedName: text('normalizedName'),
    title: text('title'),
    tags: text('tags', { mode: 'json' })
});

export const events = sqliteTable('events', {
    event_id: text('event_id').primaryKey(),
    type: text('type'),
    content: text('content', { mode: 'json' }),
    sender: text('sender'),
    room_id: text('room_id'),
    origin_server_ts: integer('origin_server_ts'),
    txn_id: text('txn_id'),
    state_key: text('state_key'),
    membership: text('membership'),
    unsigned: text('unsigned', { mode: 'json' }),
    redacts: text('redacts')
}, (table) => {
    return {
        roomIdIdx: index('events_room_id_idx').on(table.room_id),
        tsIndex: index('events_ts').on(table.origin_server_ts)
    }
})
