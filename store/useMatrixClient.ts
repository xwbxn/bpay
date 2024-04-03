import * as Notifications from 'expo-notifications';
import { RNS3 } from 'react-native-aws3';

import {
    ClientEvent, Direction, EventType, ICreateClientOpts, MatrixClient, MatrixEvent, MatrixScheduler, MediaPrefix,
    MemoryCryptoStore, MemoryStore, Preset, Room, RoomEvent, RoomMember, RoomNameType, RoomStateEvent, SyncState, Visibility
} from 'matrix-js-sdk';
import { CryptoStore } from 'matrix-js-sdk/lib/crypto/store/base';
import URI from 'urijs';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { appEmitter } from '../utils/event';
import { manipulateAsync } from 'expo-image-manipulator';
import { AppState } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_CHAT_URL
console.log('chaturl: ', BASE_URL)
const rns3Options = {
    keyPrefix: "uploads/",
    bucket: "bucket-chat",
    region: "ap-northeast-1",
    accessKey: process.env.EXPO_PUBLIC_S3_ACCESS_ID,
    secretKey: process.env.EXPO_PUBLIC_S3_ACCESS_SECRET_KEY,
    successActionStatus: 201
}
interface IDirectRoom {
    invitor: string
    invitee: string
    status: 'invite' | 'reject' | 'join' | 'leave'
}

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

class BChatClient extends MatrixClient {

    // getFriend(userId): Friend | undefined {
    //     if (!this.isDirectMember(userId)) {
    //         return undefined
    //     }
    //     const content = this.getAccountData(EventType.Direct)?.getContent() || {}
    //     const roomId = content[userId][0] || undefined
    //     const member = this.getRoom(roomId)?.getMember(userId) || undefined
    //     const name = member?.name || userId.split(":")[0].slice(1)
    //     return {
    //         userId,
    //         roomId,
    //         name,
    //         avatar_url: member?.getAvatarUrl(this.baseUrl, 50, 50, 'crop', true, true),
    //         membership: member?.membership || undefined
    //     }
    // }

    // getFriends(): Friend[] {
    //     const content = this.getAccountData(EventType.Direct)?.getContent() || {}
    //     const result = []
    //     Object.keys(content).forEach(userId => {
    //         const roomId = content[userId][0] || undefined
    //         const member = this.getRoom(roomId)?.getMember(userId) || undefined
    //         const name = member?.name || userId.split(":")[0].slice(1)
    //         result.push({
    //             userId,
    //             roomId,
    //             name,
    //             avatar_url: member?.getAvatarUrl(this.baseUrl, 50, 50, 'crop', true, true),
    //             membership: member?.membership || undefined
    //         })
    //     })
    //     return result
    // }

    // isDirectMember(userId) {
    //     const content = this.getAccountData(EventType.Direct)?.getContent() || {}
    //     return Object.keys(content).includes(userId)
    // }

    isDirectRoom(roomId) {
        const room = this.getRoom(roomId)
        if (!room) {
            return false
        }

        const content = this.getAccountData(EventType.Direct)?.getContent() || {}
        if (Object.values(content).some(i => i.includes(roomId))) {
            return true
        }

        const me = room.getMember(this.getUserId())
        if (!me) {
            return false
        }

        return me.membership === 'invite' && (me.events.member.getContent().is_direct || me.events.member.getPrevContent().is_direct)
    }

    getRoomDirect(roomId): IDirectRoom {
        const room = this.getRoom(roomId)
        if (!room) {
            return null
        }
        const memberEvts = room.getLiveTimeline().getState(Direction.Forward).getStateEvents(EventType.RoomMember)
        const evt = memberEvts.find(m => m.getSender() !== m.getStateKey())
        if (!evt) {
            return null
        }
        let status: "invite" | "reject" | "join" | "leave"
        if (room.getMyMembership() === 'join' && room.getMember(room.guessDMUserId()).membership === 'join') {
            status = 'join'
        }
        if (room.getMyMembership() === 'invite' && room.getMember(room.guessDMUserId()).membership === 'join') {
            status = 'invite'
        }
        if (room.getMyMembership() === 'join' && room.getMember(room.guessDMUserId()).membership === 'invite') {
            status = 'invite'
        }
        if (room.getMyMembership() === 'join' && room.getMember(room.guessDMUserId()).membership === 'leave') {
            if (room.getMember(room.guessDMUserId()).events.member.getPrevContent().membership === 'invite') {
                status = 'reject'
            } else {
                status = 'leave'
            }
        }

        const direct: IDirectRoom = {
            invitor: evt.getSender(),
            invitee: evt.getStateKey(),
            status: status
        }
        return direct
    }

    findDirectRoom(userId: string): Room {
        const room = this.getRooms()
            .filter(r => this.isDirectRoom(r.roomId))
            .find(r => r.getMembers().some(m => m.userId === userId))
        return room
    }

    // getDirectRoom(userId): Room | undefined {
    //     const content = this.getAccountData(EventType.Direct)?.getContent() || {}
    //     const rooms = content[userId] || []
    //     return rooms.length > 0 ? this.getRoom(rooms[0]) : undefined
    // }

    // isDirectInvitingRoom(roomId) {
    //     if (!this.isDirectRoom(roomId)) {
    //         return false
    //     }
    //     const room = this.getRoom(roomId)
    //     if (room === null) return false

    //     const dmUserId = room.guessDMUserId()
    //     const dmUser = room.getMember(dmUserId)
    //     if (dmUser.events.member.getPrevContent().membership === 'invite' && dmUser.events.member.getContent().membership === 'leave') {
    //         return true
    //     }

    //     return room.getInvitedMemberCount() === 1
    // }

    async inviteDriect(userId: string, reason?: string) {
        try {
            let room = this.findDirectRoom(userId)
            if (room) {
                throw new Error("已有好友关系");
            }

            const room_id = (await this.createRoom({
                preset: Preset.TrustedPrivateChat,
                visibility: Visibility.Private,
                is_direct: true,
                invite: [userId]
            })).room_id
            await this.invite(room_id, userId, reason)
            await this.addRoomToMDirect(room_id, userId)
            return room_id
        } catch (e) {
            console.error('inviteFriend', e)
            throw new Error(e);
        }
    }

    async acceptDirect(userId, roomId) {
        await this.joinRoom(roomId)
        await this.addRoomToMDirect(roomId, userId)
    }

    async cancelDirect(userId, roomId) {
        await this.deleteDirect(userId, roomId)
    }

    async rejectDirect(userId, roomId) {
        await this.leave(roomId)
    }

    async deleteDirect(userId: string, roomId: string) {
        const mDirectEvent = this.getAccountData(EventType.Direct)
        const content = mDirectEvent?.getContent() || {}
        const friendRooms = content[userId] || []

        friendRooms.forEach(async roomId => {
            await this.leave(roomId)
            await this.forget(roomId)
        })
        delete content[userId]
        await this.setAccountData(EventType.Direct, content)
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

    async uploadFile(opts: { uri: string, mimeType?: string, name: string, callback?: Function }) {
        const fileUri = new URI(opts.uri)
        const response = await fetch(opts.uri)
        const blob = await response.blob()
        const upload = await this.uploadContent(blob, {
            name: fileUri.filename()
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
        const thumbnail_url = this.mxcUrlToHttp(opts.uri, ratioWidth * 2, ratioHeight * 2, 'scale')
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

        _client.on(ClientEvent.Event, (evt) => {
            console.debug('emitted event:', JSON.stringify(evt))
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

    return {
        client: _client
    }
}