import 'moment/locale/zh-cn';

import _ from 'lodash'
import { ClientEvent, Room, RoomEvent } from 'matrix-js-sdk';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';
import * as Linking from 'expo-linking';

import { Avatar, Badge, Divider, Icon, ListItem, Text, useTheme, Image } from '@rneui/themed';

import { hiddenTagName, useMatrixClient } from '../../store/useMatrixClient';
import BpayHeader from '../../components/BpayHeader';
import { globalStyle } from '../../utils/styles';
import { useProfile } from '../../store/globalContext';
import { roomPreview } from './eventMessage';
import Qrcode from './components/Qrcode';
import { BarcodeScanningResult } from 'expo-camera/next';
import Toast from 'react-native-root-toast';

const Session = ({ navigation }) => {

    const [inviteBadge, setInviteBadge] = useState(0)
    const { theme } = useTheme()
    const { client } = useMatrixClient()
    const [rooms, setRooms] = useState([])
    const { profile } = useProfile()
    const [openQrCode, setOpenQrCode] = useState(false)

    useEffect(() => {
        const refreshRooms = _.debounce(() => {
            const filteredRooms = [...client.getRooms()]
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
                    } return (b.getLastLiveEvent()?.event.origin_server_ts
                        || b.getMember(client.getUserId()).events.member.event.origin_server_ts) // 在被邀请还没加入房间时，取不到最后的event，因此需要取邀请时间
                        - (a.getLastLiveEvent()?.event.origin_server_ts
                            || a.getMember(client.getUserId()).events.member.event.origin_server_ts)
                })
            setRooms(filteredRooms)
            setInviteBadge(client.getRooms().filter(i => client.isDirectRoom(i.roomId)).reduce((count, room) => count + (room.getMyMembership() === 'invite' ? 1 : 0), 0))
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
        let title = item.name
        const preview = roomPreview(item, client)
        let subTitle = preview.text
        let updateAt = preview.ts
        let avatar_url = isDirectRoom
            ? directMember?.getAvatarUrl(client.baseUrl, 50, 50, 'scale', true, true)
            : item?.getAvatarUrl(client.baseUrl, 50, 50, 'scale')

        if (item.getMyMembership() === 'leave') {
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
                            <ListItem.Title lineBreakMode='clip' numberOfLines={1} style={{ fontSize: globalStyle.titleFontStyle.fontSize, fontWeight:'600' }}>{title}</ListItem.Title>
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
            <MenuOption onSelect={() => setOpenQrCode(true)}>
                <View style={menuStyles.buttonItem}>
                    <Icon name='scan' containerStyle={{ width: 40 }} type='ionicon' color={theme.colors.white}></Icon>
                    <Text style={[menuStyles.titleStyle, globalStyle.headTitleFontStyle]}>扫一扫</Text>
                </View>
            </MenuOption>
        </MenuOptions>
    </Menu>, [inviteBadge])

    const onBarcodeScanned = (res: BarcodeScanningResult) => {
        setOpenQrCode(false)
        if (res.data.startsWith('!')) {
            navigation.push('RoomPreview', { id: res.data })
            return
        }
        if (res.data.startsWith('@')) {
            navigation.push('Member', { userId: res.data })
            return
        }
        Linking.canOpenURL(res.data).then(can => {
            if (can) {
                Linking.openURL(res.data)
            } else {
                Toast.show(res.data)
            }
        })
    }

    return <View style={styles.container}>
        <BpayHeader title='聊天' leftComponent={profile?.avatar ? <Avatar rounded source={{ uri: profile?.avatar }} size={24}
            onPress={() => navigation.push('Member', { userId: client.getUserId() })}></Avatar>
            : <Icon iconStyle={{ color: theme.colors.background }}
                name="user" type="font-awesome" onPress={() => navigation.push('Member', { userId: client.getUserId() })}></Icon>}
            rightComponent={headerRight}></BpayHeader>
        <Qrcode isVisible={openQrCode} onClose={() => {
            setOpenQrCode(false)
        }} onBarcodeScanned={onBarcodeScanned}></Qrcode>
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