import AsyncStorage from '@react-native-async-storage/async-storage';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseSync } from 'expo-sqlite/next';
import { ClientEvent, createClient, MatrixClient, RoomEvent, RoomMemberEvent, SyncState } from 'matrix-js-sdk';

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

        // token过期
        _client.on(ClientEvent.Sync, (state, lastState, data) => {
            if (state === SyncState.Error) {
                console.log('sync error:', data.error.name)
                switch (data.error.name) {
                    case 'M_UNKNOWN_TOKEN':
                        AsyncStorage.getItem("MATRIX_AUTH").then(data => {
                            const auth = JSON.parse(data)
                            if (auth.refresh_token) {
                                _client.refreshToken(auth.refresh_token).then(res => {
                                    _client.setAccessToken(res.access_token)
                                    AsyncStorage.setItem('MATRIX_AUTH', JSON.stringify({
                                        ...auth, ...res
                                    }))
                                })
                            }
                        }).catch(err => {
                            console.log('refresh token error:', err)
                        })
                        break
                }
            }
        })

        // 如有新的未读通知, 则显示房间
        _client.on(ClientEvent.Room, (room) => {
            room.on(RoomEvent.UnreadNotifications, (unreadNotifications) => {
                console.log('emmit UnreadNotifications', unreadNotifications)
                if (room.tags[hiddenTagName] &&
                    ((unreadNotifications?.total ?? 0) > 0 ||
                        (unreadNotifications?.highlight ?? 0) > 0)) {
                    _client.deleteRoomTag(room.roomId, hiddenTagName)
                }
            })
        })

        // _client.credentials.userId = profile.name
        // _client.setAccessToken(token)
        // _client.startClient({ initialSyncLimit: 15 })
    }

    return {
        client: _client
    }
}