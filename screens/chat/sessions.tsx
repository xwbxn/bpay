import React, { useEffect, useState } from 'react'
import { FlatList, TouchableOpacity, View, StyleSheet, Alert, useWindowDimensions } from 'react-native'
import { Avatar, Badge, Divider, Icon, Image, ListItem, Text, useTheme } from '@rneui/themed'
import moment from 'moment'
import 'moment/locale/zh-cn'
import { useMatrixClient } from '../../store/chat'
import { EventType, MsgType, Room } from 'matrix-js-sdk'


const Session = ({ navigation }) => {

    useEffect(() => {
        // set nav bar
        navigation.setOptions({
            title: '聊天', headerRight: () => {
                return <Icon color={theme.colors.background} name='plus-circle' type='feather' size={30}
                    onPress={() => { setIsMenuShow(true) }}></Icon>
            }
        })
    }, [])

    const { width, height } = useWindowDimensions()
    const [isMenuShow, setIsMenuShow] = useState(false)
    const { theme } = useTheme()
    const { client, rooms } = useMatrixClient()
    const [roomSummary, setRoomSummary] = useState([])

    const getRoomLabel = (r: Room) => {
        r.getTimelineNeedsRefresh
        if (r.getMyMembership() === 'invite') {
            return `${r.getCreator()} 请求和你聊天`
        }

        const lastEvt = r.getLastLiveEvent()
        if (lastEvt === null) {
            return ""
        }

        switch (lastEvt.event.type) {
            case EventType.RoomMessage:
                let previewMsg = '[其他信息]'
                switch (lastEvt.event.content.msgtype) {
                    case MsgType.Text:
                        previewMsg = lastEvt.event.content.body
                        break
                    case MsgType.Image:
                        previewMsg = '[图片信息]'
                        break
                    case MsgType.Video:
                        previewMsg = '[视频信息]'
                        break
                    default:
                        previewMsg = `[消息类型:${lastEvt.event.content.msgtype}]`
                }
                if (r.getJoinedMemberCount() + r.getInvitedMemberCount() > 2) {
                    return `${lastEvt.sender.name}: ${previewMsg}`.slice(0, 35)
                } else {
                    return previewMsg.slice(0, 35)
                }
            case EventType.RoomMember:
                if (lastEvt.event.content.membership === 'join') {
                    return `${lastEvt.event.sender} 加入了聊天`
                }
                if (lastEvt.event.content.membership === 'leave') {
                    return `${lastEvt.event.sender} 离开了聊天`
                }
                break
        }

        return ""
    }

    useEffect(() => {
        const summary = []
        rooms.filter(r => r.getMyMembership() !== 'leave')
            .forEach(room => {
                summary.push({
                    id: room.roomId,
                    name: room.name,
                    label: getRoomLabel(room),
                    unread: room.getUnreadNotificationCount(),
                    updatedAt: room.getLastActiveTimestamp(),
                    type: room.getMyMembership()
                })
            })
        setRoomSummary(summary.sort((a, b) => b.updatedAt - a.updatedAt))
    }, [rooms])

    const onDirectPress = () => {
        setIsMenuShow(false)
        navigation.push('Invite')
    }

    const onRoomPress = () => {
        setIsMenuShow(false)
        navigation.push('Invite')
    }

    const onPress = (item) => {
        navigation.push('Room', {
            id: item.id
        })
    }

    const onLongPress = (item) => {
    }

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => onPress(item)} onLongPress={() => onLongPress(item)}>
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8 }}>
                <View>
                    <Avatar size={50} rounded title={item.name[0]} containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
                    {item.unread !== 0 && <Badge value={item.unread} status="error" containerStyle={{ position: 'absolute', top: -5, left: 35 }}></Badge>}
                </View>
                <View style={{ flex: 1, justifyContent: 'space-between', padding: 8 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.name}</Text>
                    <Text style={{ fontSize: 14, color: theme.colors.grey3 }}>{item.label}</Text>
                </View>
                <View style={{ paddingTop: 10 }}>
                    <Text style={{ fontSize: 12, color: theme.colors.grey3 }}>{moment(item.updatedAt).fromNow()}</Text>
                </View>
            </View>
            <Divider style={{ width: "100%", borderColor: theme.colors.primary }}></Divider>
        </TouchableOpacity>
    );

    return <View style={styles.container}>
        <View style={styles.content}>
            <FlatList data={roomSummary} renderItem={renderItem}>
            </FlatList>
        </View>

        {isMenuShow &&
            <View style={{
                position: 'absolute', height, width, zIndex: 999, alignItems: 'flex-end'
            }}
            >
                <View style={{ width: 200 }}>
                    <ListItem bottomDivider containerStyle={{ backgroundColor: theme.colors.black }} onPress={() => { onDirectPress() }}>
                        <Icon name='group-add' type='material' color={theme.colors.white}></Icon>
                        <ListItem.Content>
                            <ListItem.Title><Text style={{ color: theme.colors.white }}>添加好友</Text></ListItem.Title>
                        </ListItem.Content>
                    </ListItem>
                    <ListItem bottomDivider containerStyle={{ backgroundColor: theme.colors.black }} onPress={() => { onRoomPress() }}>
                        <Icon name='groups' type='material' color={theme.colors.white}></Icon>
                        <ListItem.Content>
                            <ListItem.Title><Text style={{ color: theme.colors.white }}>添加群聊</Text></ListItem.Title>
                        </ListItem.Content>
                    </ListItem>
                    <View style={{ position: 'relative', left: -180, height, width: width, backgroundColor: 'grey', opacity: 0 }}
                        onTouchStart={() => { setIsMenuShow(false) }}></View>
                </View>
            </View>}
    </View>
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { backgroundColor: '#ffffff', flex: 1 },
})

export default Session