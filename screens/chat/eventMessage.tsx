import { EventType, IContent, MatrixEvent, MsgType, NotificationCountType, Room } from "matrix-js-sdk";
import { BChatClient } from "../../store/useMatrixClient";
import { Text } from "@rneui/themed";

export const eventMessage = (event: MatrixEvent, room: Room, client: BChatClient): {
    [id: string]: any
} => {
    if (event.isRedacted()) {
        return {
            text: "[消息已被撤回]",
            createdAt: 0,
            pending: false,
            sent: false
        }
    }
    const handler = eventMap[event.getType()]
    if (handler) {
        return handler(event, room, client)
    }
    return { text: `[不支持的消息类型${event.getType()}]`, system: false }
}

const eventMap = {
    [EventType.RoomCreate]: (event: MatrixEvent, room: Room, client: BChatClient) => {
        if (client.isDirectRoom(room.roomId)) {
            return { text: `[${room.getMember(room.getCreator()).name} 发起了对话]`, system: true }
        } else {
            return { text: `[${room.getMember(room.getCreator()).name} 发起了群聊]`, system: true }
        }
    },
    [EventType.RoomMember]: (event: MatrixEvent, room: Room, client: BChatClient) => {
        const membership = event.getContent().membership
        const prevMembership = event.getPrevContent().membership
        if (membership === 'join' && prevMembership === 'join') {
            if (event.getContent().avatar_url !== event.getPrevContent().avatar_url) {
                return { text: `[${event.sender.name} 修改了头像]`, system: true }
            }
            if (event.getContent().displayname !== event.getPrevContent().displayname) {
                return { text: `[${event.getPrevContent().displayname} 将昵称修改为 ${event.getContent().displayname}]`, system: true }
            }
        }
        if (client.isDirectRoom(room.roomId)) {
            if (membership === 'invite') {
                return { text: `[${event.sender.name} 发起了好友申请]`, system: true }
            }
            if (membership === 'join' && prevMembership === undefined) {
                return { text: `[${event.sender.name} 加入了对话]`, system: true }
            }
            if (membership === 'join' && prevMembership === 'invite') {
                return { text: `[${event.sender.name} 同意了好友申请]`, system: true }
            }
            if (membership === 'leave' && prevMembership === 'invite') {
                return { text: `[${event.sender.name} 拒绝了好友申请]`, system: true }
            }
            if (membership === 'leave' && prevMembership === 'join') {
                return { text: `[${event.sender.name} 删除了好友 ${event.target.name}]`, system: true }
            }
        } else {
            if (membership === 'join') {
                return { text: `[${event.sender.name} 加入了群聊]`, system: true }
            }
            if (membership === 'leave' && event.sender.userId !== event.target.userId) {
                return { text: `[${event.target.name} 被 ${event.sender.name} 移出了群聊]`, system: true }
            }
            if (membership === 'leave' && event.sender.userId === event.target.userId) {
                return { text: `[${event.sender.name} 离开了群聊]`, system: true }
            }
            if (membership === 'knock') {
                return { text: `[${event.sender.name} 申请加入群聊]`, system: true }
            }
            if (membership === 'invite' && prevMembership === 'knock') {
                return { text: `[${event.sender.name} 同意 ${event.target.name} 加入群聊]`, system: true }
            }
            if (membership === 'invite' && prevMembership !== 'knock') {
                return { text: `[${event.sender.name} 邀请 ${event.target.name} 加入群聊]`, system: true }
            }
        }
        console.log(event.getContent(), event.getPrevContent())
        return { text: `[不支持的消息类型${event.getType()}]`, system: true }
    },
    [EventType.RoomMessage]: (event: MatrixEvent, room: Room, client: BChatClient) => {
        const handler = messageMap[event.getContent().msgtype]
        if (handler) {
            return handler(event.getContent(), room, client)
        }
        return { text: `[不支持的消息类型${event.getContent().msgtype}]`, system: false }
    },
    [EventType.RoomPowerLevels]: (event: MatrixEvent, room: Room, client: BChatClient) => {
        const current = event.getContent().users
        const prev = event.getPrevContent().users
        const appended = []
        const removed = []
        for (const key in current) {
            if (Object.prototype.hasOwnProperty.call(current, key)) {
                const element = current[key];
                if (element !== 100 && !prev[key]) {
                    appended.push(key)
                }
            }
        }
        for (const key in prev) {
            if (Object.prototype.hasOwnProperty.call(prev, key)) {
                const element = prev[key];
                if (element !== 100 && !current[key]) {
                    removed.push(key)
                }
            }
        }

        const appendedUsersText = appended.length > 0 ? `将 ${appended.map(i => room.getMember(i).name).join(',')} 提升为管理员` : ''
        const removedUsersText = removed.length > 0 ? `将 ${removed.map(i => room.getMember(i).name).join(',')} 从管理员中移除` : ''
        if (appended.length > 0 || removed.length > 0) {
            return { text: `[${event.sender.name} ${appendedUsersText} ${removedUsersText}]`, system: true }
        }
        return { _id: null }
    },
    [EventType.RoomMessageEncrypted]: (event: MatrixEvent, room: Room, client: BChatClient) => {
        return { text: `[暂不支持加密消息]`, system: false }
    },
    [EventType.RoomRedaction]: (event: MatrixEvent, room: Room, client: BChatClient) => {
        return { _id: null }
    },
    [EventType.RoomJoinRules]: (event: MatrixEvent, room: Room, client: BChatClient) => {
        return { _id: null }
    },
    [EventType.RoomHistoryVisibility]: (event: MatrixEvent, room: Room, client: BChatClient) => {
        return { _id: null }
    },
    [EventType.RoomGuestAccess]: (event: MatrixEvent, room: Room, client: BChatClient) => {
        return { _id: null }
    }
}

const messageMap = {
    [MsgType.Text]: (content: IContent, room: Room, client: BChatClient) => {
        return { text: content.body }
    },
    [MsgType.Image]: (content: IContent, room: Room, client: BChatClient) => {
        const image = content.info?.thumbnail_url || content.url
        return {
            text: '',
            image: image.startsWith("mxc://") ? client.mxcUrlToHttp(image) : image,
            w: content.info?.thumbnail_info?.w || content.w,
            h: content.info?.thumbnail_info?.h || content.h
        }
    },
    [MsgType.Video]: (content: IContent, room: Room, client: BChatClient) => {
        const video = content.info?.thumbnail_url || content.url
        return {
            text: '',
            video: video.startsWith("mxc://") ? client.mxcUrlToHttp(video) : video,
            w: content.info?.thumbnail_info?.w || 150,
            h: content.info?.thumbnail_info?.h || 100,
            localUri: content.local_uri,
            localImg: content.local_img
        }
    },
    [MsgType.File]: (content: IContent, room: Room, client: BChatClient) => {
        return {
            text: <Text>📄{content.body}</Text>
        }
    },
    [MsgType.Audio]: (content: IContent, room: Room, client: BChatClient) => {
        return {
            text: '[语音]'
        }
    },
}

export const roomPreview = (room: Room, client: BChatClient) => {
    const events = room.getLiveTimeline().getEvents()
    for (let index = 0; index < events.length; index++) {
        const element = events[events.length - index - 1];
        const handler = roomPreviewMap[element.getType()]
        if (handler) {
            return { text: handler(element, room, client), ts: element.localTimestamp }
        }
    }

    // 被邀请还未加入，无法取到timeline，因此取membership
    if (room.getMyMembership() === 'invite') {
        const me = room.getMember(client.getUserId())
        if (!me) {
            return { text: `[邀请您加入群聊]`, ts: new Date().getMilliseconds() }
        }
        const sender = room.getMember(me.events.member.getSender())
        return { text: `[${sender.name} 邀请您加入群聊]`, ts: me.events.member.localTimestamp }
    }
    return { text: `[不支持的消息类型]`, ts: room.getLastActiveTimestamp() }
}

const roomPreviewMap = {
    [EventType.RoomCreate]: (event: MatrixEvent, room: Room, client: BChatClient) => {
        if (client.isDirectRoom(room.roomId)) {
            return `[${room.getMember(room.getCreator()).name} 发起了对话]`
        } else {
            return `[${room.getMember(room.getCreator()).name} 发起了群聊]`
        }
    },
    [EventType.RoomMember]: (event: MatrixEvent, room: Room, client: BChatClient) => {
        const membership = event.getContent().membership
        const prevMembership = event.getPrevContent().membership
        if (membership === 'join' && prevMembership === 'join') {
            if (event.getContent().avatar_url !== event.getPrevContent().avatar_url) {
                return `[${event.sender.name} 修改了头像]`
            }
            if (event.getContent().displayname !== event.getPrevContent().displayname) {
                return `[${event.getPrevContent().displayname} 将昵称修改为 ${event.getContent().displayname}]`
            }
        }
        if (client.isDirectRoom(room.roomId)) {
            if (membership === 'join' && prevMembership === 'invite' && event.getSender() !== client.getUserId()) {
                return '[同意了您的好友申请]'
            }
            if (membership === 'join' && prevMembership === 'invite' && event.getSender() === client.getUserId()) {
                return '[同意了对方的好友申请]'
            }
            if (membership === 'leave' && prevMembership === 'invite' && event.getSender() === client.getUserId()) {
                return '[拒绝了您的好友申请]'
            }
            if (membership === 'leave' && prevMembership === 'join' && event.getSender() === client.getUserId()) {
                return '[已不再是好友关系]'
            }
        } else {
            if (membership === 'join') {
                return `[${event.sender.name} 加入了群聊]`
            }
            if (membership === 'leave' && event.sender.userId !== event.target.userId) {
                return `[${event.target.name} 被 ${event.sender.name} 移出了群聊]`
            }
            if (membership === 'leave' && event.sender.userId === event.target.userId) {
                return `[${event.sender.name} 离开了群聊]`
            }
            if (membership === 'invite' && event.target.userId === client.getUserId()) {
                return `[${event.sender.name} 邀请您加入群聊]`
            }
        }
        console.log(event.getType(), event.getContent(), event.getPrevContent())
        return `[不支持的消息类型${event.getType()}]`
    },
    [EventType.RoomMessage]: (event: MatrixEvent, room: Room, client: BChatClient) => {
        const handler = eventPreviewMap[event.getContent().msgtype]
        const prefix = client.isDirectRoom(room.roomId) ? '' : event.sender.name + ": "
        if (handler) {
            return prefix + handler(event.getContent())
        }
        return prefix + `[不支持的消息类型${event.getContent().msgtype}]`
    },
    [EventType.RoomMessageEncrypted]: (event: MatrixEvent, room: Room, client: BChatClient) => {
        return `[暂不支持加密消息]`
    },
    [EventType.RoomPowerLevels]: (event: MatrixEvent, room: Room, client: BChatClient) => {
        return `[管理权限]`
    },
    [EventType.RoomRedaction]: (event: MatrixEvent, room: Room, client: BChatClient) => {
        return `[${event.sender.name} 撤回了一条消息]`
    },
    [EventType.RoomJoinRules]: (event: MatrixEvent, room: Room, client: BChatClient) => {
        return `[邀请方式]`
    },
    [EventType.RoomHistoryVisibility]: (event: MatrixEvent, room: Room, client: BChatClient) => {
        return `[历史消息]`
    },
    [EventType.RoomGuestAccess]: (event: MatrixEvent, room: Room, client: BChatClient) => {
        return `[游客权限]`
    }
}

const eventPreviewMap = {
    [MsgType.Text]: (content: IContent, room: Room, client: BChatClient) => {
        return content.body
    },
    [MsgType.Image]: (content: IContent, room: Room, client: BChatClient) => {
        return '[图片]'
    },
    [MsgType.Video]: (content: IContent, room: Room, client: BChatClient) => {
        return '[视频]'
    },
    [MsgType.File]: (content: IContent, room: Room, client: BChatClient) => {
        return '[文件]'
    },
    [MsgType.Audio]: (content: IContent, room: Room, client: BChatClient) => {
        return '[语音]'
    },
}