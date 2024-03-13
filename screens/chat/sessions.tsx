import 'moment/locale/zh-cn';

import { EventType, MsgType, Room } from 'matrix-js-sdk';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import {
    FlatList, StyleSheet, TouchableOpacity, useWindowDimensions, View
} from 'react-native';

import { Avatar, Badge, Divider, Icon, ListItem, Text, useTheme, Button } from '@rneui/themed';

import { useMatrixClient } from '../../store/chat';
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';

const Session = ({ navigation }) => {

    useEffect(() => {
        // set nav bar
        const menuStyles = StyleSheet.create({
            optionWrapper: {
                backgroundColor: theme.colors.grey1,
            },
            titleStyle: {
                fontSize: 18,
                color: theme.colors.white,
                marginLeft: 20
            },
            buttonItem: {
                flexDirection: 'row',
                justifyContent: 'center',
                padding: 16,
            }
        })
        navigation.setOptions({
            title: '聊天', headerRight: () => {
                return <Menu>
                    <MenuTrigger>
                        <Icon color={theme.colors.background} name='plus-circle' type='feather' size={30} />
                    </MenuTrigger>
                    <MenuOptions customStyles={{ optionWrapper: menuStyles.optionWrapper }}>
                        <MenuOption onSelect={() => { onDirectPress() }}>
                            <View style={menuStyles.buttonItem}>
                                <Icon name='comment' type='octicon' color={theme.colors.white}></Icon>
                                <Text style={menuStyles.titleStyle}>好友</Text>
                            </View>
                        </MenuOption>
                        <MenuOption>
                            <View style={menuStyles.buttonItem}>
                                <Icon name='comment-discussion' type='octicon' color={theme.colors.white}></Icon>
                                <Text style={menuStyles.titleStyle}>群组</Text>
                            </View>
                        </MenuOption>
                    </MenuOptions>
                </Menu>
            }
        })
    }, [])

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
        navigation.push('Invite')
    }

    const onRoomPress = () => {
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
        <Menu>
            <MenuTrigger triggerOnLongPress onAlternativeAction={() => onPress(item)}>
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
            </MenuTrigger>
            <MenuOptions customStyles={{ optionsContainer: { marginLeft: 100, marginTop: 20 } }}>
                <MenuOption text='置顶' customStyles={{
                    optionText: {
                        padding: 10, fontSize: 18
                    }
                }}></MenuOption>
                <MenuOption text='删除该聊天' customStyles={{
                    optionText: {
                        padding: 10, fontSize: 18
                    }
                }}></MenuOption>
            </MenuOptions>
        </Menu>
    );

    return <View style={styles.container}>
        <View style={styles.content}>
            <FlatList data={roomSummary} renderItem={renderItem}>
            </FlatList>
        </View>
    </View>
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { backgroundColor: '#ffffff', flex: 1 },
})

export default Session