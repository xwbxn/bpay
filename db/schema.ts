import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

// "event_id" text(256) NOT NULL,
// "type" text(256),
// "room_id" text(256),
// "content" text(4096),
// "origin_server_ts" integer,
// "sender" TEXT(256),
// "state_key" TEXT(256),
// "txn_id" text(256),
// "membership" text(256),
// "unsigned" text(4096),
// "redacts" text(256),
// PRIMARY KEY ("event_id")
// );

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
