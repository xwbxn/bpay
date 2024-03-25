import * as Notifications from 'expo-notifications';
import {
    ClientEvent, EventType, ICreateClientOpts, MatrixClient, MatrixScheduler, MediaPrefix, MemoryCryptoStore,
    MemoryStore, Preset, RoomEvent, SyncState, Visibility
} from 'matrix-js-sdk';
import { CryptoStore } from 'matrix-js-sdk/lib/crypto/store/base';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { appEmitter } from '../utils/event';
import URI from 'urijs';

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

type Friend = {
    userId: string;
    roomId: string;
    name: string;
    avatar_url: string;
    membership: string;
};

class BChatClient extends MatrixClient {

    getFriend(userId): Friend | undefined {
        if (!this.isFriend(userId)) {
            return undefined
        }
        const content = this.getAccountData(EventType.Direct)?.getContent() || {}
        const roomId = content[userId][0] || undefined
        const member = this.getRoom(roomId)?.getMember(userId) || undefined
        const name = member?.name || userId.split(":")[0].slice(1)
        return {
            userId,
            roomId,
            name,
            avatar_url: member?.getAvatarUrl(this.baseUrl, 50, 50, 'crop', true, true),
            membership: member?.membership || undefined
        }
    }

    getFriends(): Friend[] {
        const content = this.getAccountData(EventType.Direct)?.getContent() || {}
        const result = []
        Object.keys(content).forEach(userId => {
            const roomId = content[userId][0] || undefined
            const member = this.getRoom(roomId)?.getMember(userId) || undefined
            const name = member?.name || userId.split(":")[0].slice(1)
            result.push({
                userId,
                roomId,
                name,
                avatar_url: member?.getAvatarUrl(this.baseUrl, 50, 50, 'crop', true, true),
                membership: member?.membership || undefined
            })
        })
        return result
    }

    isFriend(userId) {
        const content = this.getAccountData(EventType.Direct)?.getContent() || {}
        return Object.keys(content).includes(userId)
    }

    isFriendRoom(roomId) {
        const content = this.getAccountData(EventType.Direct)?.getContent() || {}
        return Object.values(content).some(i => i.includes(roomId))
    }

    async inviteFriend(userId: string, reason?: string) {
        try {
            const { room_id } = await this.createRoom({
                is_direct: true,
                preset: Preset.TrustedPrivateChat,
                visibility: Visibility.Private,
                invite: [userId]
            })
            await this.addRoomToMDirect(room_id, userId)
            if (reason) {
                await this.sendTextMessage(room_id, reason)
            }
            return room_id
        } catch (e) {
            console.error('inviteFriend', e)
            throw new Error(e);
        }
    }

    async acceptFriend(userId, roomId) {
        await this.joinRoom(roomId)
        await this.addRoomToMDirect(roomId, userId)

    }

    async deleteFriend(userId: string) {
        const mDirectEvent = this.getAccountData(EventType.Direct)
        const content = mDirectEvent?.getContent() || {}
        const friendRooms = content[userId] || []

        friendRooms.forEach(async roomId => {
            await this.leave(roomId)
            await this.forget(roomId)
        })
        delete content[userId]
        return await this.setAccountData(EventType.Direct, content)
    }

    async addRoomToMDirect(roomId, userId) {
        const mx = this
        const mDirectsEvent = mx.getAccountData('m.direct');
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

        return await mx.setAccountData('m.direct', userIdToRoomIds);
    }

    setRoomOnTop(roomId: string, onTop: boolean) {
        return onTop ? this.setRoomTag(roomId, favTagName, {}) : this.deleteRoomTag(roomId, favTagName)
    }

    isRoomOnTop(roomId: string) {
        return favTagName in (this.getRoom(roomId)?.tags || {})
    }

    async uploadFile(uri: string) {
        const fileUri = new URI(uri)
        const response = await fetch(uri)
        const blob = await response.blob()
        const upload = await this.uploadContent(blob, {
            name: fileUri.filename()
        })
        return upload
    }

    getThumbnails(uri: string, width?: number, height?: number) {
        const _width = width || 150
        const _height = height || 100
        const mediaId = uri.split("/")[3] || undefined
        const ratio = Math.max(_width, _height) / 150
        const ratioWidth = Math.floor(_width / ratio)
        const ratioHeight = Math.floor(_height / ratio)
        const thumbnail_url = `${this.baseUrl}${MediaPrefix.V3}/thumbnail/chat.b-pay.life/${mediaId}?width=${ratioWidth * 3}&height=${ratioHeight * 3}&method=scale&timeout_ms=5000`
        return {
            width: ratioWidth,
            height: ratioHeight,
            thumbnail_url
        }
    }
}

const sendRoomNotify = async (room) => {
    // 通知栏消息
    if (room.getMyMembership() === 'invite') {
        await Notifications.dismissAllNotificationsAsync()
        await Notifications.scheduleNotificationAsync({
            content: {
                title: `您有一条来自${room.name}的邀请`
            },
            trigger: null,
        });
    }
}

const sendTimelineNotify = async (event) => {
    // 通知栏消息
    if (event.getSender() !== _client.getUserId()) {
        await Notifications.dismissAllNotificationsAsync()
        await Notifications.scheduleNotificationAsync({
            content: {
                title: `您有一条来自${event.getSender()}的消息`
            },
            trigger: null,
        });
    }
}

let _client: BChatClient = null

export const favTagName = 'm.favourite'
export const hiddenTagName = 'm.hidden'
export const useMatrixClient = () => {

    if (_client === null) {
        _client = createClient({
            baseUrl: 'https://chat.b-pay.life',
            useAuthorizationHeader: true,
        })
        _client.usingExternalCrypto = true // hack , ignore encrypt

        _client.on(ClientEvent.Event, (evt) => {
            console.debug('emitted event:', evt.getId(), evt.getType(), evt.getContent())
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
            }
        })

        // 如有新的未读通知, 则显示房间
        _client.on(ClientEvent.Room, (room) => {
            room.on(RoomEvent.UnreadNotifications, (unreadNotifications) => {
                console.log('emmit UnreadNotifications', unreadNotifications)
                if (room.tags[hiddenTagName] &&
                    ((unreadNotifications?.total || 0) > 0 ||
                        (unreadNotifications?.highlight || 0) > 0)) {
                    _client.deleteRoomTag(room.roomId, hiddenTagName)
                }
            })
        })

        // 更新空房间名为原名
        _client.on(RoomEvent.Name, (room) => {
            if (room && room.normalizedName.startsWith("ernptyroornwas")) {
                console.log('rename room', room.name, room.normalizedName)
                const hisFriend = room.normalizedName.split("ernptyroornwas")[1]
                if (hisFriend) {
                    _client.setRoomName(room.roomId, hisFriend)
                }
            }
        })

        // 用户信息
        _client.on(ClientEvent.AccountData, (evt) => {
            console.log('account data: ', evt.getType(), evt.getContent())
        })
    }

    return {
        client: _client
    }
}