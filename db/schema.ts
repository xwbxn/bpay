import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const events = sqliteTable('events', {
    event_id: text('event_id').primaryKey(),
    type: text('type'),
    room_id: text('room_id'),
    content: text('content', { mode: 'json' }),
    origin_server_ts: integer('origin_server_ts', { mode: 'timestamp_ms' }),
    sender: text('sender'),
    state_key: text('state_key'),
    txn_id: text('txn_id'),
    membership: text('membership'),
    unsigned: text('unsigned', { mode: 'json' }),
    redacts: text('redacts')
}, (table) => ({
    roomIndex: index('roomIndex').on(table.room_id, table.origin_server_ts)
})
);
