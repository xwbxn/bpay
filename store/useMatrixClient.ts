import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClientEvent, EventType, ICreateClientOpts, MatrixClient, MatrixScheduler, MemoryCryptoStore, MemoryStore, Preset, RoomEvent, RoomMember, RoomMemberEvent, SyncState, Visibility } from 'matrix-js-sdk';
import { CryptoStore } from 'matrix-js-sdk/lib/crypto/store/base';

let cryptoStoreFactory = (): CryptoStore => new MemoryCryptoStore();

function amendClientOpts(opts: ICreateClientOpts): ICreateClientOpts {
    opts.store =
        opts.store ??
        new MemoryStore({
            localStorage: global.localStorage,
        });
    opts.scheduler = opts.scheduler ?? new MatrixScheduler();
    opts.cryptoStore = opts.cryptoStore ?? cryptoStoreFactory();

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
        const content = this.getAccountData(EventType.Direct)?.getContent() ?? {}
        const roomId = content[userId][0] ?? undefined
        const member = this.getRoom(roomId)?.getMember(userId) ?? undefined
        const name = member?.name ?? userId.split(":")[0].slice(1)
        return {
            userId,
            roomId,
            name,
            avatar_url: member?.getAvatarUrl(this.baseUrl, 50, 50, 'crop', true, true),
            membership: member?.membership ?? undefined
        }
    }

    getFriends(): Friend[] {
        const content = this.getAccountData(EventType.Direct)?.getContent() ?? {}
        const result = []
        Object.keys(content).forEach(userId => {
            const roomId = content[userId][0] ?? undefined
            const member = this.getRoom(roomId)?.getMember(userId) ?? undefined
            const name = member?.name ?? userId.split(":")[0].slice(1)
            result.push({
                userId,
                roomId,
                name,
                avatar_url: member?.getAvatarUrl(this.baseUrl, 50, 50, 'crop', true, true),
                membership: member?.membership ?? undefined
            })
        })
        return result
    }

    isFriend(userId) {
        const content = this.getAccountData(EventType.Direct)?.getContent() ?? {}
        return Object.keys(content).includes(userId)
    }

    isFriendRoom(roomId) {
        const content = this.getAccountData(EventType.Direct)?.getContent() ?? {}
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
            const errcodes = ['M_UNKNOWN', 'M_BAD_JSON', 'M_ROOM_IN_USE', 'M_INVALID_ROOM_STATE', 'M_UNSUPPORTED_ROOM_VERSION'];
            if (errcodes.includes(e.errcode)) {
                throw new Error(e);
            }
            throw new Error('Something went wrong!');
        }
    }

    async acceptFriend(userId, roomId) {
        await this.joinRoom(roomId)
        await this.addRoomToMDirect(roomId, userId)
    }

    async deleteFriend(userId: string) {
        const mDirectEvent = this.getAccountData(EventType.Direct)
        const content = mDirectEvent?.getContent() ?? {}
        const friendRooms = content[userId] ?? []

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
        return favTagName in this.getRoom(roomId).tags
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

        // 更新空房间名为原名
        _client.on(RoomEvent.Name, (room) => {
            if (room && room.normalizedName.startsWith("ernptyroornwas")) {
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