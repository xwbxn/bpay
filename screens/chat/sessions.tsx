import 'moment/locale/zh-cn';

import { ClientEvent, EventType, MsgType, Room, RoomEvent } from 'matrix-js-sdk';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';

import { Avatar, Badge, Divider, Icon, ListItem, Text, useTheme } from '@rneui/themed';

import { hiddenTagName, useMatrixClient } from '../../store/useMatrixClient';

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
                marginLeft: 12
            },
            buttonItem: {
                flexDirection: 'row',
                padding: 12,
            }
        })
        navigation.setOptions({
            title: '聊天', headerRight: () => {
                return <Menu>
                    <MenuTrigger>
                        <Icon color={theme.colors.background} name='plus-circle' type='feather' size={30} />
                    </MenuTrigger>
                    <MenuOptions customStyles={{ optionWrapper: menuStyles.optionWrapper, optionsContainer: { marginTop: 20 } }}>
                        <MenuOption onSelect={onContactPress}>
                            <View style={menuStyles.buttonItem}>
                                <Icon name='person' type='octicon' containerStyle={{ width: 40 }} size={30} color={theme.colors.white}></Icon>
                                <Text style={menuStyles.titleStyle}>联系人</Text>
                            </View>
                        </MenuOption>
                        <Divider style={{ width: '100%' }}></Divider>
                        <MenuOption onSelect={onGroupPress}>
                            <View style={menuStyles.buttonItem}>
                                <Icon name='comment-discussion' containerStyle={{ width: 40 }} size={30} type='octicon' color={theme.colors.white}></Icon>
                                <Text style={menuStyles.titleStyle}>发起群聊</Text>
                            </View>
                        </MenuOption>
                    </MenuOptions>
                </Menu>
            }, headerLeft: () => {
                return <Icon containerStyle={{ width: 50 }} iconStyle={{ fontSize: 30, color: theme.colors.background }}
                    onPress={() => { navigation.push('Member', { userId: client.getUserId() }) }}
                    name="user" type="font-awesome" ></Icon>
            }
        })
    }, [])

    const { theme } = useTheme()
    const { client } = useMatrixClient()
    const [rooms, setRooms] = useState([])

    useEffect(() => {
        const refreshRooms = () => {
            const sortedRooms = [...client.getRooms()]
                .filter(r => !r.tags[hiddenTagName])
                .sort((a, b) => {
                    if (client.isRoomOnTop(a.roomId) && !client.isRoomOnTop(b.roomId)) {
                        return -1
                    } else if (!client.isRoomOnTop(a.roomId) && client.isRoomOnTop(b.roomId)) {
                        return 1
                    } return b.getLastActiveTimestamp() - a.getLastActiveTimestamp()
                })
            setRooms(sortedRooms)
        }
        refreshRooms()



        client.on(RoomEvent.Timeline, refreshRooms)
        client.on(RoomEvent.Receipt, refreshRooms)
        client.on(ClientEvent.Room, refreshRooms)
        client.on(ClientEvent.DeleteRoom, refreshRooms)
        client.on(RoomEvent.MyMembership, refreshRooms)
        client.on(RoomEvent.Tags, refreshRooms)
        client.on(RoomEvent.Name, refreshRooms)

        return () => {
            client.off(RoomEvent.Timeline, refreshRooms)
            client.off(RoomEvent.Receipt, refreshRooms)
            client.off(ClientEvent.Room, refreshRooms)
            client.off(ClientEvent.DeleteRoom, refreshRooms)
            client.off(RoomEvent.MyMembership, refreshRooms)
            client.off(RoomEvent.Tags, refreshRooms)
            client.off(RoomEvent.Name, refreshRooms)
        }
    }, [])


    const onContactPress = () => {
        navigation.push('Contact')
    }

    const onGroupPress = () => {
        navigation.push('GroupChat')
    }

    const onPressRoom = (item) => {
        navigation.push('Room', {
            id: item.roomId
        })
    }

    const toggleFavor = (item: Room) => {
        client.setRoomOnTop(item.roomId, !client.isRoomOnTop(item.roomId))
    }

    const handleHide = (item: Room) => {
        if (item.getInvitedAndJoinedMemberCount() === 1) {
            client.leave(item.roomId).then(() => {
                client.forget(item.roomId)
            })
        } else {
            client.setRoomTag(item.roomId, hiddenTagName, {})
        }
    }

    const renderItem = ({ item }: { item: Room }) => {
        const isFriendRoom = client.isFriendRoom(item.roomId)
        let title = item.name
        let subTitle = ''
        let updateAt = new Date().getTime()

        if (item.getMyMembership() === 'invite') { //收到邀请信息
            if (item.getDMInviter()) {
                subTitle = `来自${item.getDMInviter()?.split(":")[0]?.substring(1)}的好友申请`
            } else {
                subTitle = "邀请您加入群聊"
            }
            updateAt = item.getMember(item.myUserId).events.member.localTimestamp
        } else if (item.getMyMembership() === 'join') { //已加入聊天
            if (item.getInvitedMemberCount() == 1 && item.getInvitedAndJoinedMemberCount() == 2) {
                //发起单聊等待对方同意
                subTitle = '等待对方同意'
            } else {
                // 预览消息
                const lastEvt = item.getLastLiveEvent()
                updateAt = item.getLastActiveTimestamp()
                switch (lastEvt.getType()) {
                    case EventType.RoomMessage:
                        subTitle = lastEvt.getContent().body || ''
                        if (lastEvt.getContent().msgtype === MsgType.Image) {
                            subTitle = '[图片消息]'
                        }
                        break;
                    case EventType.RoomMember:
                        subTitle = '现在可以开始聊天了'
                    default:
                        break;
                }
            }
        } else if (item.getMyMembership() === 'leave') {
            return <></>
        }

        return (
            <Menu>
                <MenuTrigger triggerOnLongPress onAlternativeAction={() => onPressRoom(item)}>
                    <ListItem topDivider bottomDivider
                        containerStyle={client.isRoomOnTop(item.roomId) && { backgroundColor: theme.colors.grey5 }}>
                        <Avatar size={50} rounded title={isFriendRoom ? title[0] : '群'}
                            containerStyle={{ backgroundColor: theme.colors.primary }}>
                            {item.getUnreadNotificationCount() > 0
                                && <Badge value={item.getUnreadNotificationCount()} status="error"
                                    containerStyle={{ position: 'absolute', top: 0, left: 0 }}></Badge>}
                        </Avatar>
                        <ListItem.Content>
                            <ListItem.Title style={{ fontSize: 22 }}>{title}</ListItem.Title>
                            <ListItem.Subtitle>{subTitle.slice(0, 20)}</ListItem.Subtitle>
                        </ListItem.Content>
                        <ListItem.Subtitle>{moment(updateAt).fromNow()}</ListItem.Subtitle>
                    </ListItem>
                </MenuTrigger>
                <MenuOptions customStyles={{ optionsContainer: { marginLeft: 100, marginTop: 20 } }}>
                    <MenuOption onSelect={() => toggleFavor(item)} text={client.isRoomOnTop(item.roomId) ? '取消置顶' : '置顶'} customStyles={{
                        optionText: {
                            padding: 10, fontSize: 18
                        }
                    }}></MenuOption>
                    <MenuOption onSelect={() => handleHide(item)} text='删除该聊天' customStyles={{
                        optionText: {
                            padding: 10, fontSize: 18
                        }
                    }}></MenuOption>
                </MenuOptions>
            </Menu>)
    }

    return <View style={styles.container}>
        <View style={styles.content}>
            <FlatList data={rooms} renderItem={renderItem}>
            </FlatList>
        </View>
    </View>
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { backgroundColor: '#ffffff', flex: 1 },
})

export default Session