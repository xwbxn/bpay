import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseSync } from 'expo-sqlite/next';
import { ClientEvent, createClient, MatrixClient, Room, RoomEvent, SyncState } from 'matrix-js-sdk';
import { IStore } from 'matrix-js-sdk/lib/store';
import { useState } from 'react';

import migrations from '../drizzle/migrations';
import { useProfile } from './globalContext';
import { SqliteStore } from './sqliteStore/sqliteStore';

const expoDb = openDatabaseSync("chat.db");
const db = drizzle(expoDb);
let _client: MatrixClient = null

export const useMatrixClient = () => {
    const { success, error } = useMigrations(db, migrations)
    console.debug('migrate db:', success, error)

    const [profile, token] = useProfile(state => [state.profile, state.matrixToken])

    if (_client === null) {
        _client = createClient({
            baseUrl: 'https://chat.b-pay.life',
            useAuthorizationHeader: true,
        })
        _client.store = new SqliteStore("chat.db")
        _client.usingExternalCrypto = true // hack , ignore encrypt

        _client.on(ClientEvent.Sync, (state) => {
            if (state === SyncState.Prepared) {
                _client.on(RoomEvent.Timeline, ((event, room, toStartOfTimeline, removed, data) => {
                    console.log('new event to store', event.getId(), room.name, event.getType(), event.getContent())
                    // _store.storeEvents()
                }))
            }
        })

        _client.credentials.userId = profile.name
        _client.setAccessToken(token)
        _client.startClient()
    }

    return {
        client: _client
    }
}