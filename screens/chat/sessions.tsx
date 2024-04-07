import 'moment/locale/zh-cn';

import _ from 'lodash'
import { ClientEvent, Direction, EventType, JoinRule, MsgType, Room, RoomEvent, RoomMemberEvent } from 'matrix-js-sdk';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';

import { Avatar, Badge, Divider, Icon, ListItem, Text, useTheme, Image } from '@rneui/themed';

import { hiddenTagName, useMatrixClient } from '../../store/useMatrixClient';
import BpayHeader from '../../components/BpayHeader';
import { globalStyle } from '../../utils/styles';
import { useProfile } from '../../store/globalContext';

const Session = ({ navigation }) => {

    const [inviteBadge, setInviteBadge] = useState(0)
    const { theme } = useTheme()
    const { client } = useMatrixClient()
    const [rooms, setRooms] = useState([])
    const { profile } = useProfile()

    useEffect(() => {
        const refreshRooms = _.debounce(() => {
            const sortedRooms = [...client.getRooms()]
                .filter(r => !r.tags[hiddenTagName])
                // 单聊需要显示对方退出的, 群聊各种状态均需要显示
                .filter(r => client.isDirectRoom(r.roomId)
                    ? ((r.getMyMembership() === 'join' && r.getMember(r.guessDMUserId()).membership === 'join') // 正常单聊
                        || (r.getMyMembership() === 'join'
                            && r.getMember(r.guessDMUserId()).membership === 'leave'
                            && r.getMember(r.guessDMUserId()).events.member.getPrevContent().membership === 'join')) // 对方退出单聊
                    : !!r.getMember(client.getUserId()))
                .sort((a, b) => {
                    if (client.isRoomOnTop(a.roomId) && !client.isRoomOnTop(b.roomId)) {
                        return -1
                    } else if (!client.isRoomOnTop(a.roomId) && client.isRoomOnTop(b.roomId)) {
                        return 1
                    } return b.getLastActiveTimestamp() - a.getLastActiveTimestamp()
                })
            setRooms(sortedRooms)
            setInviteBadge(client.getRooms().reduce((count, room) => count + (room.getMyMembership() === 'invite' ? 1 : 0), 0))
        }, 150)

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
        client.setRoomTag(item.roomId, hiddenTagName, {})
    }

    const renderItem = ({ item }: { item: Room }) => {
        const isDirectRoom = client.isDirectRoom(item.roomId)
        const directMember = isDirectRoom ? item.getMembers().find(i => i.userId !== client.getUserId()) : null
        const createEvt = item.getLiveTimeline().getState(Direction.Forward).getStateEvents(EventType.RoomCreate)
        let title = item.name
        let subTitle = `[${item.getMember(createEvt[0]?.getSender())?.name} 发起了聊天]`
        let updateAt = createEvt[0]?.localTimestamp
        let avatar_url = isDirectRoom
            ? directMember?.getAvatarUrl(client.baseUrl, 50, 50, 'scale', true, true)
            : item?.getAvatarUrl(client.baseUrl, 50, 50, 'scale')

        if (item.getMyMembership() === 'invite') { // 只有群邀请在这里显示
            const myMember = item.getMember(client.getUserId())
            const invitor = myMember.events.member.getSender()
            const invotorName = item.getMember(invitor)?.name
            subTitle = `[${invotorName || item.guessDMUserId()} 邀请您加入群聊]`
            updateAt = item.getMember(item.myUserId).events.member.localTimestamp
        } else if (item.getMyMembership() === 'join') { //已加入聊天
            // 预览消息
            const lastEvt = item.getLastLiveEvent()
            updateAt = item.getLastActiveTimestamp()
            switch (lastEvt.getType()) {
                case EventType.RoomMessage:
                    let sender = ''
                    if (!client.isDirectRoom(lastEvt.getRoomId())) {
                        sender = lastEvt.getSender()
                        const member = item.getMember(sender)
                        if (member) {
                            sender = member.name
                        }
                    }
                    subTitle = (sender ? sender + ':' : '') + lastEvt.getContent().body || ''
                    if (lastEvt.getContent().msgtype === MsgType.Image) {
                        subTitle = '[图片消息]'
                    }
                    if (lastEvt.getContent().msgtype === MsgType.Video) {
                        subTitle = '[视频]'
                    }
                    break;
                case EventType.RoomMember:
                    if (client.isDirectRoom(lastEvt.getRoomId())) {
                        const lastMembership = lastEvt.getPrevContent()?.membership
                        if (lastEvt.getContent().membership === 'leave' && lastMembership === 'join') {
                            subTitle = `[对方已不再是好友]`
                        } else {
                            subTitle = '[可以开始聊天了]'
                        }
                    }
                    break
                default:
                    break;
            }

            // 有群审批
            if (item.getMember(item.myUserId).powerLevel >= 50
                && item.getMembers().filter(m => m.membership === JoinRule.Knock).length > 0) {
                subTitle = `[您有${item.getMembers().filter(m => m.membership === JoinRule.Knock).length}个入群申请待审批]`
                updateAt = new Date().getTime()
            }
        } else if (item.getMyMembership() === 'leave') {
            return <></>
        }

        return (
            <Menu>
                <MenuTrigger triggerOnLongPress onAlternativeAction={() => onPressRoom(item)}>
                    <ListItem topDivider bottomDivider
                        containerStyle={[client.isRoomOnTop(item.roomId) && { backgroundColor: '#f5f5f5' }, { padding: 10 }]}>
                        {avatar_url
                            ? <Avatar size={50} rounded source={{ uri: avatar_url }}
                                containerStyle={{ backgroundColor: theme.colors.primary }}>
                                {item.getUnreadNotificationCount() > 0
                                    && <Badge value={item.getUnreadNotificationCount()} status="error"
                                        containerStyle={{ position: 'absolute', top: 0, left: 0 }}></Badge>}
                            </Avatar> :
                            <Avatar size={50} rounded title={isDirectRoom ? title[0] : '群'}
                                containerStyle={{ backgroundColor: theme.colors.primary }}>
                                {item.getUnreadNotificationCount() > 0
                                    && <Badge value={item.getUnreadNotificationCount()} status="error"
                                        containerStyle={{ position: 'absolute', top: 0, left: 0 }}></Badge>}
                            </Avatar>}
                        <ListItem.Content>
                            <ListItem.Title lineBreakMode='clip' numberOfLines={1} style={{ fontSize: 18 }}>{title}</ListItem.Title>
                            <ListItem.Subtitle lineBreakMode='clip' numberOfLines={1} style={{ color: theme.colors.grey2 }}>{subTitle}</ListItem.Subtitle>
                        </ListItem.Content>
                        <ListItem.Subtitle style={{ color: theme.colors.grey2 }}>{moment(updateAt).fromNow()}</ListItem.Subtitle>
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

    const menuStyles = StyleSheet.create({
        optionWrapper: {
            backgroundColor: theme.colors.grey1,
        },
        titleStyle: {
            color: theme.colors.white,
            marginLeft: 12
        },
        buttonItem: {
            flexDirection: 'row',
            padding: 10,
        }
    })

    const headerRight = useMemo(() => <Menu>
        <MenuTrigger>
            <Icon color={theme.colors.background} name='plus-circle' type='feather'></Icon>
            {inviteBadge > 0 && <Badge containerStyle={{ position: 'absolute', left: 20, top: -4 }}
                badgeStyle={{ backgroundColor: theme.colors.error }} value={inviteBadge}></Badge>}
        </MenuTrigger>
        <MenuOptions customStyles={{ optionWrapper: menuStyles.optionWrapper, optionsContainer: { marginTop: 20, marginLeft: -16 } }}>
            <MenuOption onSelect={onContactPress}>
                <View style={menuStyles.buttonItem}>
                    <Icon name='person' type='octicon' containerStyle={{ width: 40 }} color={theme.colors.white}></Icon>
                    <Text style={[menuStyles.titleStyle, globalStyle.headTitleFontStyle]}>联系人</Text>
                </View>
            </MenuOption>
            <Divider style={{ width: '100%' }}></Divider>
            <MenuOption onSelect={onGroupPress}>
                <View style={menuStyles.buttonItem}>
                    <Icon name='comment-discussion' containerStyle={{ width: 40 }} type='octicon' color={theme.colors.white}></Icon>
                    <Text style={[menuStyles.titleStyle, globalStyle.headTitleFontStyle]}>发起群聊</Text>
                </View>
            </MenuOption>
            <Divider style={{ width: '100%' }}></Divider>
            <MenuOption>
                <View style={menuStyles.buttonItem}>
                    <Icon name='scan' containerStyle={{ width: 40 }} type='ionicon' color={theme.colors.white}></Icon>
                    <Text style={[menuStyles.titleStyle, globalStyle.headTitleFontStyle]}>扫一扫</Text>
                </View>
            </MenuOption>
        </MenuOptions>
    </Menu>, [inviteBadge])


    return <View style={styles.container}>
        <BpayHeader title='聊天' leftComponent={<Avatar rounded source={{ uri: profile?.avatar }} size={24}
            onPress={() => navigation.push('Member', { userId: client.getUserId() })}></Avatar>}
            rightComponent={headerRight}></BpayHeader>
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