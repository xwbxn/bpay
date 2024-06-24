import * as FileSystem from 'expo-file-system';
import { dismissNotificationAsync, scheduleNotificationAsync } from 'expo-notifications';
import _ from 'lodash';
import {
    ClientEvent, Direction, EventType, ICreateClientOpts, MatrixClient, MatrixEvent,
    MatrixEventEvent, MatrixScheduler, MediaPrefix, MemoryCryptoStore, MemoryStore, Method,
    NotificationCountType, Preset, Room, RoomEvent, RoomNameType, SyncState, Upload, UploadProgress,
    Visibility
} from 'matrix-js-sdk';
import { CryptoStore } from 'matrix-js-sdk/lib/crypto/store/base';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { appEmitter } from '../utils/event';
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

    private _txnToEvent: Map<string, MatrixEvent> = new Map<string, MatrixEvent>()

    public async getEvent(eventId) {
        const e = await _store.getEvent(eventId)
        if (e) {
            return new MatrixEvent({
                event_id: e.event_id,
                sender: e.sender,
                room_id: e.room_id,
                origin_server_ts: e.origin_server_ts.getTime(),
                state_key: e.state_key,
                content: e.content,
                type: e.type,
                txn_id: e.txn_id,
                membership: e.membership,
                unsigned: e.unsigned,
                redacts: e.redacts
            })
        }
        return null
    }

    public async searchEvent(roomId, keyword) {
        const rows = await _store.searchEvent(roomId, keyword)
        return _.groupBy(rows, (value) => value.room_id)
    }

    public getSessions() {
        return this.getRooms()
            // 单聊需要显示对方退出的, 群聊各种状态均需要显示
            .filter(r => this.isDirectRoom(r.roomId)
                ? ((r.getMyMembership() === 'join' && r.getMember(r.guessDMUserId()).membership === 'join') // 正常单聊
                    || (r.getMyMembership() === 'join'
                        && r.getMember(r.guessDMUserId()).membership === 'leave'
                        && r.getMember(r.guessDMUserId()).events.member.getPrevContent().membership === 'join')) // 对方退出单聊
                : !!r.getMember(this.getUserId()))
            .filter(r => r.getMember(this.getUserId()).membership !== 'knock') // 不显示申请还未通过的
            .sort((a, b) => {
                if (this.isRoomOnTop(a.roomId) && !this.isRoomOnTop(b.roomId)) {
                    return -1
                } else if (!this.isRoomOnTop(a.roomId) && this.isRoomOnTop(b.roomId)) {
                    return 1
                } return (b.getLastLiveEvent()?.event.origin_server_ts
                    || b.getMember(this.getUserId()).events.member.event.origin_server_ts) // 在被邀请还没加入房间时，取不到最后的event，因此需要取邀请时间
                    - (a.getLastLiveEvent()?.event.origin_server_ts
                        || a.getMember(this.getUserId()).events.member.event.origin_server_ts)
            })
    }

    public async scrollbackLocal(room: Room, limit = 30): Promise<number> {
        console.debug('scrollbackLocal', room.roomId)
        const store = this.store as SqliteStore
        return store.scrollbackLocal(room, limit)
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
            try { await this.clearRoomEvent(roomId) } catch { }
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
        const uploadUrl = this.http.getUrl("/upload", undefined, MediaPrefix.V3);
        const contentType = opts.mimeType || "application/octet-stream";

        const uploadTask = FileSystem.createUploadTask(uploadUrl.href, opts.uri, {
            headers: {
                "Authorization": "Bearer " + this.http.opts.accessToken,
                "Content-Type": contentType
            }
        }, (data: FileSystem.UploadProgressData) => {
            opts.callback && opts.callback({
                loaded: data.totalBytesSent,
                total: data.totalBytesExpectedToSend
            })
        })
        const upload = await uploadTask.uploadAsync()
        return JSON.parse(upload.body)
    }

    addLocalEvent(room: Room, event: MatrixEvent) {
        room.getLiveTimeline().addEvent(event, { toStartOfTimeline: false })
        this._txnToEvent.set(event.getTxnId(), event)
    }

    removeLocalEvent(room: Room, event: MatrixEvent) {
        return room.getLiveTimeline().removeEvent(event.getId())
    }

    // send event, recv event, sync event 以上三类信息需要保存
    async saveToStore(event: MatrixEvent, room: Room) {
        const txnId = event.getTxnId()
        // 本地发送的消息，需要在处理回声消息，并将回声消息的资源替换为本地资源后进行持久化
        if (txnId) {
            // 收到回声后,持久化 
            // console.debug('--------saveToStore.txnId--------', event.getId(), txnId)
            event.on(MatrixEventEvent.LocalEventIdReplaced, async (echo) => {
                const localEvent = this._txnToEvent.get(txnId)
                // console.debug('--------saveToStore.LocalEventIdReplaced--------', event.getId(), txnId)
                // 更新消息为本地资源，例如图片，视频url
                if (localEvent) {
                    // console.debug('--------saveToStore.UpdateLocalEvent--------', event.getId(), localEvent.getId(), txnId)
                    Object.assign(event.event.content, { ...localEvent.event.content })
                    this._txnToEvent.delete(txnId)
                }
                return await _store.persistEvent(event)
            })
        } else {
            // 非本地消息，外部发来的消息直接持久化不做处理
            // console.debug('--------saveToStore.noTxnId--------', event.getId(), txnId)
            return await _store.persistEvent(event)
        }
    }

    async clearRoomEvent(roomId) {
        _store.clearRoomEvent(roomId)
    }
}


const sendRoomNotify = async (room, membership) => {
    // 通知栏消息
    if (membership === 'invite'
        // && AppState.currentState.match(/background|inactive/)
    ) {
        scheduleNotificationAsync({
            content: {
                title: 'BPay',
                body: `您有新的聊天邀请`,
            },
            trigger: null,
        })
    }
}

let _notificationId: string
const sendTimelineNotify = _.debounce(async (event: MatrixEvent, room: Room) => {
    // 通知栏消息
    if (event.getSender() !== _client.getUserId()
        // && AppState.currentState.match(/background|inactive/)
        && event.getType() === EventType.RoomMessage) {

        const highlight = _client.getRooms().reduce((count, room) => room.getUnreadNotificationCount(NotificationCountType.Highlight), 0)
        const total = _client.getRooms().reduce((count, room) => count + room.getUnreadNotificationCount(), 0)
        if (total > 0) {
            if (_notificationId) {
                await dismissNotificationAsync(_notificationId)
                _notificationId = null
            }
            _notificationId = await scheduleNotificationAsync({
                content: {
                    title: 'BPay',
                    body: `${highlight > 0 ? "有人@你 " : ''}您有${total}条未读信息`,
                    badge: total
                },
                trigger: null,
            })
        }
    }
}, 1000)


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

        // 保存本地消息
        _client.on(RoomEvent.Timeline, (event, room) => {
            // 本地发送的信息，收到其他人的信息，同步服务器信息均会触发 
            _client.saveToStore(event, room)
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
                // 预加载离线消息
                _client.getRooms().forEach(r => {
                    _store.preloadPage(r)
                })

                // 通知
                _client.on(RoomEvent.Timeline, sendTimelineNotify)
                _client.on(RoomEvent.MyMembership, sendRoomNotify)
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