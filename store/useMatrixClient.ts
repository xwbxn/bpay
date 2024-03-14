import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseSync } from 'expo-sqlite/next';
import { ClientEvent, createClient, MatrixClient, RoomEvent } from 'matrix-js-sdk';

// import migrations from '../drizzle/migrations';
import { useProfile } from './globalContext';
// import { SqliteStore } from './sqliteStore/sqliteStore';

// const expoDb = openDatabaseSync("chat.db");
// const db = drizzle(expoDb);

let _client: MatrixClient = null


export const favTagName = 'm.favourite'
export const hiddenTagName = 'm.hidden'

export const useMatrixClient = () => {
    // const { success, error } = useMigrations(db, migrations)

    const [profile, token] = useProfile(state => [state.profile, state.matrixToken])

    if (_client === null) {
        _client = createClient({
            baseUrl: 'https://chat.b-pay.life',
            useAuthorizationHeader: true,
        })
        // _client.store = new SqliteStore("chat.db")
        _client.usingExternalCrypto = true // hack , ignore encrypt

        _client.on(ClientEvent.Event, (evt) => {
            console.log('emitted event:', evt.getId(), evt.getType(), evt.getContent())
        })

        _client.on(ClientEvent.Room, (room) => {
            console.log('create room ', room.name)
            room.on(RoomEvent.UnreadNotifications, (unreadNotifications) => {
                console.log('emmit UnreadNotifications', unreadNotifications)
                if (room.tags[hiddenTagName] &&
                    ((unreadNotifications?.total ?? 0) > 0 ||
                        (unreadNotifications?.highlight ?? 0) > 0)) {
                    _client.deleteRoomTag(room.roomId, hiddenTagName)
                }
            })
        })

        _client.credentials.userId = profile.name
        _client.setAccessToken(token)
        _client.startClient({ initialSyncLimit: 15 })
    }

    return {
        client: _client
    }
}