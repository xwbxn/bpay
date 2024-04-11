import * as Notifications from 'expo-notifications';

import {
    ClientEvent, Direction, EventType, ICreateClientOpts, MatrixClient, MatrixEvent, MatrixScheduler, MediaPrefix,
    MemoryCryptoStore, MemoryStore, Method, NotificationCountType, Preset, Room, RoomEvent, RoomMember, RoomNameType, RoomStateEvent, SyncState, UploadProgress, Visibility
} from 'matrix-js-sdk';
import { CryptoStore } from 'matrix-js-sdk/lib/crypto/store/base';
import URI from 'urijs';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { appEmitter } from '../utils/event';
import { AppState } from 'react-native';
import { SqliteStore } from './sqliteStore';

const BASE_URL = process.env.EXPO_PUBLIC_CHAT_URL
console.log('chaturl: ', BASE_URL)

let cryptoStoreFactory = (): CryptoStore => new MemoryCryptoStore();

function amendClientOpts(opts: ICreateClientOpts): ICreateClientOpts {
    opts.store =
        opts.store ||
        new MemoryStore({
            localStorage: global.localStorage,
        });
    opts.scheduler = opts.scheduler || new MatrixScheduler();
    opts.cryptoStore = opts.cryptoStore || cryptoStoreFactory();

    return opts;
}

export function createClient(opts: ICreateClientOpts): BChatClient {
    return new BChatClient(amendClientOpts(opts));
}

export class BChatClient extends MatrixClient {

    public async scrollback(room: Room, limit = 30): Promise<Room> {
        console.debug('overide scrollback')
        const store = this.store as SqliteStore
        return store.scrollbackFromDB(room, limit)
    }

    public getMediaMessages(
        roomId: string,
        fromToken: string | null,
        limit = 30,
        dir: Direction | string,
        filter?: {},
    ) {
        const path = `/rooms/${roomId}/messages`
        const params: Record<string, string> = {
            limit: limit.toString(),
            dir: dir,
        };

        if (fromToken) {
            params.from = fromToken;
        }

        if (filter) {
            params.filter = JSON.stringify(filter);
        }
        console.log('params', params)
        return this.http.authedRequest(Method.Get, path, params);
    }

    isDirectRoom(roomId) {
        const mDirectEvent = this.getAccountData(EventType.Direct)
        const content = mDirectEvent?.getContent() || {}

        for (const key in content) {
            if (Object.prototype.hasOwnProperty.call(content, key)) {
                const rooms = content[key];
                if (rooms.includes(roomId)) {
                    return true
                }
            }
        }

        const room = this.getRoom(roomId)
        if (!room) {
            return false
        }

        const createEvent = room.getLiveTimeline().getState(Direction.Forward).getStateEvents(EventType.RoomCreate)[0]
        if (!createEvent) {
            return false
        }
        return Object.hasOwn(createEvent.getContent(), EventType.Direct)
    }

    findDirectRoom(userId: string): Room {
        const mDirectEvent = this.getAccountData(EventType.Direct)
        const content = mDirectEvent?.getContent() || {}

        const directRooms = content[userId] || []
        if (directRooms.length > 0) {
            return this.getRoom(directRooms[0])
        }

        const room = this.getRooms()
            .filter(r => this.isDirectRoom(r.roomId))
            .find(r => r.getMembers().some(m => m.userId === userId))
        return room
    }

    async inviteDriect(userId: string, reason?: string) {
        try {
            let room = this.findDirectRoom(userId)
            if (room && room.getMyMembership() !== 'leave') {
                throw new Error("已有好友关系");
            }

            const room_id = (await this.createRoom({
                preset: Preset.PrivateChat,
                visibility: Visibility.Private,
                is_direct: true,
                invite: [userId],
                creation_content: {
                    [EventType.Direct]: {
                        invitor: this.getUserId(),
                        invitee: userId,
                        reason
                    }
                },
            })).room_id
            await this.addRoomToMDirect(room_id, userId)
            return room_id
        } catch (e) {
            console.error('inviteFriend', e)
            throw new Error(e);
        }
    }

    async acceptDirect(userId, roomId) {
        await this.deleteDirect(userId)
        await this.joinRoom(roomId)
        await this.addRoomToMDirect(roomId, userId)
    }

    async cancelDirect(userId, roomId) {
        try {
            await this.kick(roomId, userId, 'cancel')
        } catch (e) {
            console.warn('cancelDirect', e.toString())
        }
        await this.deleteDirect(userId)
    }

    async rejectDirect(userId, roomId) {
        await this.leave(roomId)
        await this.forget(roomId)
    }

    async deleteDirect(userId: string) {
        const mDirectEvent = this.getAccountData(EventType.Direct)
        const content = mDirectEvent?.getContent() || {}

        const friendRooms = content[userId] || []
        friendRooms.forEach(async roomId => {
            try { await this.leave(roomId) } catch { }
            try { await this.forget(roomId) } catch { }
        })
        delete content[userId]
        await this.setAccountData(EventType.Direct, content)
    }

    async addRoomToMDirect(roomId, userId) {
        const mx = this
        const mDirectsEvent = mx.getAccountData(EventType.Direct);
        let userIdToRoomIds = {};

        if (typeof mDirectsEvent !== 'undefined') userIdToRoomIds = mDirectsEvent.getContent();

        // remove it from the lists of any others users
        // (it can only be a DM room for one person)
        Object.keys(userIdToRoomIds).forEach((thisUserId) => {
            const roomIds = userIdToRoomIds[thisUserId];

            if (thisUserId !== userId) {
                const indexOfRoomId = roomIds.indexOf(roomId);
                if (indexOfRoomId > -1) {
                    roomIds.splice(indexOfRoomId, 1);
                }
            }
        });

        // now add it, if it's not already there
        if (userId) {
            const roomIds = userIdToRoomIds[userId] || [];
            if (roomIds.indexOf(roomId) === -1) {
                roomIds.push(roomId);
            }
            userIdToRoomIds[userId] = roomIds;
        }

        return await mx.setAccountData(EventType.Direct, userIdToRoomIds);
    }

    setRoomOnTop(roomId: string, onTop: boolean) {
        return onTop ? this.setRoomTag(roomId, favTagName, {}) : this.deleteRoomTag(roomId, favTagName)
    }

    isRoomOnTop(roomId: string) {
        return favTagName in (this.getRoom(roomId)?.tags || {})
    }

    canDo(roomId: string, action: 'ban' | 'invite' | 'kick' | 'redact' | 'm.room.avatar' | 'm.room.canonical_alias' | 'm.room.encryption' | 'm.room.history_visibility' | 'm.room.name' | 'm.room.power_levels' | 'm.room.server_acl' | 'm.room.tombstone' | 'm.room.topic') {
        const room = this.getRoom(roomId)
        if (!room) {
            return false
        }
        const myPowerLevel = room.getMember(this.getUserId()).powerLevel
        const roomState = room.getLiveTimeline().getState(Direction.Forward).getStateEvents(EventType.RoomPowerLevels)
        if (roomState.length === 0) {
            return false
        }
        const roomPowerLevels = roomState[0].getContent()
        const targetPower = (action.startsWith('m.') ? roomPowerLevels.events[action] : roomPowerLevels[action]) || 0
        return myPowerLevel >= targetPower
    }

    async uploadFile(opts: { uri: string, mimeType?: string, name: string, callback?: (progress: UploadProgress) => void }) {
        const fileUri = new URI(opts.uri)
        const response = await fetch(opts.uri)
        const blob = await response.blob()
        const upload = await this.uploadContent(blob, {
            name: fileUri.filename(),
            progressHandler: opts.callback
        })
        return { content_uri: upload.content_uri || undefined }
    }

    async getThumbnails(opts: {
        uri: string,
        height: number,
        width: number,
        mimeType: string,
        name: string,
        callback?: Function
    }) {

        const _width = opts.width || 150
        const _height = opts.height || 100
        const ratio = Math.max(_width, _height) / 150
        const ratioWidth = Math.floor(_width / ratio)
        const ratioHeight = Math.floor(_height / ratio)
        const thumbnail_url = this.mxcUrlToHttp(opts.uri, ratioWidth * 4, ratioHeight * 4, 'scale')
        return {
            thumbnail_url: thumbnail_url,
            thumbnail_info: {
                w: ratioWidth,
                h: ratioHeight,
                type: opts.mimeType
            }
        }
    }

}

let currentNotifId = null

const sendRoomNotify = async (room) => {
    // 通知栏消息
    if (room.getMyMembership() === 'invite'
        && AppState.currentState.match(/background|inactive/)) {
        if (currentNotifId !== null) {
            await Notifications.dismissNotificationAsync(currentNotifId)
        }
        currentNotifId = await Notifications.scheduleNotificationAsync({
            content: {
                title: room.name,
                body: `有新的聊天邀请`
            },
            trigger: null,
        });
    }
}

const sendTimelineNotify = async (event: MatrixEvent, room: Room) => {
    // 通知栏消息
    if (event.getSender() !== _client.getUserId()
        && event.getType() === EventType.RoomMessage
        && AppState.currentState.match(/background|inactive/)) {
        if (currentNotifId !== null) {
            await Notifications.dismissNotificationAsync(currentNotifId)
        }
        currentNotifId = await Notifications.scheduleNotificationAsync({
            content: {
                title: room.name,
                body: `有新的消息`
            },
            trigger: null,
        });
    }
}

let _client: BChatClient = null
let _store: SqliteStore = null

export const favTagName = 'm.favourite'
export const hiddenTagName = 'm.hidden'
export const useMatrixClient = () => {

    if (_client === null) {
        _client = createClient({
            baseUrl: BASE_URL,
            useAuthorizationHeader: true,
            roomNameGenerator(roomId, state) {
                switch (state.type) {
                    case RoomNameType.Actual:
                        return state.name;
                    case RoomNameType.Generated:
                        const countWithoutMe = state.count - 1;
                        if (!state.names.length) {
                            return "空房间";
                        } else if (state.names.length === 1 && countWithoutMe <= 1) {
                            return state.names[0];
                        } else if (state.names.length === 2 && countWithoutMe <= 2) {
                            return `${state.names[0]} 和 ${state.names[1]}`;
                        } else {
                            return `${state.names[0]} 和 ${countWithoutMe} 人`;
                        }
                    case RoomNameType.EmptyRoom:
                        return state.oldName || '空房间'
                }
            },
        })
        _client.usingExternalCrypto = true // hack , ignore encrypt

        _client.on(RoomEvent.Timeline, (event, room) => {
            _store.persistEvent(event)
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
                            _client.stopClient()
                            appEmitter.emit('TO_LOGIN')
                            console.log('refresh token error:', err)
                        })
                        break
                }
            }
            if (state === SyncState.Prepared) {
                // 通知
                _client.on(RoomEvent.Timeline, sendTimelineNotify)
                _client.on(ClientEvent.Room, sendRoomNotify)

                _client.getRooms().forEach(r => {
                    _store.preloadPage(r)
                    if (!_client.isDirectRoom(r.roomId) && r.getMyMembership() === 'invite') {
                        r.setUnreadNotificationCount(NotificationCountType.Total, r.getUnreadNotificationCount() + 1)
                    }
                })

                _client.on(RoomEvent.MyMembership, (room, membership, prevMembership) => {
                    if (!_client.isDirectRoom(room.roomId)) {
                        if (membership === 'invite') {
                            room.setUnreadNotificationCount(NotificationCountType.Total, room.getUnreadNotificationCount() + 1)
                        } else if (membership === 'join' && prevMembership === 'invite') {
                            room.setUnreadNotificationCount(NotificationCountType.Total, room.getUnreadNotificationCount() - 1)
                        }
                    }
                })
            }

        })

        // 如有新的消息, 则显示房间
        _client.on(ClientEvent.Room, (room) => {
            room.on(RoomEvent.Timeline, (event) => {
                if (room.tags[hiddenTagName]) {
                    _client.deleteRoomTag(room.roomId, hiddenTagName)
                }
            })
        })

        // 用户信息
        _client.on(ClientEvent.AccountData, (evt) => {
            console.log('account data: ', evt.getType(), evt.getContent())
        })

    }

    const setStore = (name) => {
        if (name) {
            _store = new SqliteStore({
                name,
                localStorage: global.localStorage,
            })
            _client.store = _store
        }
    }

    return {
        client: _client,
        setStore
    }
}