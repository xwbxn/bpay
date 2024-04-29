import 'moment/locale/zh-cn';

import { BarcodeScanningResult } from 'expo-camera/next';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import RNQRGenerator from 'rn-qr-generator';

import _ from 'lodash';
import { ClientEvent, Room, RoomEvent } from 'matrix-js-sdk';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';
import Toast from 'react-native-root-toast';

import { Avatar, Badge, Button, Divider, Icon, ListItem, Overlay, Text, useTheme } from '@rneui/themed';

import BpayHeader from '../../components/BpayHeader';
import { hiddenTagName, useMatrixClient } from '../../store/useMatrixClient';
import { globalStyle } from '../../utils/styles';
import Qrcode from './components/Qrcode';
import { roomPreview } from './eventMessage';
import { useProfile } from '../../store/globalContext';
import { Image } from 'expo-image';

const Session = ({ navigation }) => {

    const [inviteBadge, setInviteBadge] = useState(0)
    const { theme } = useTheme()
    const { client } = useMatrixClient()
    const [rooms, setRooms] = useState([])
    const [openQrCode, setOpenQrCode] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const { profile } = useProfile()

    async function allowsNotificationsAsync() {
        const settings = await Notifications.getPermissionsAsync();
        const permission = (
            settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
        );
        if (!permission) {
            Alert.alert('通知权限申请', '开启通知权限以便于有新消息是能提醒您',
                [
                    { text: '不同意' },
                    {
                        text: '同意', onPress: () => {
                            Notifications.requestPermissionsAsync()
                        }
                    }
                ])
        }
    }

    useEffect(() => {
        if (profile.authenticated) {
            allowsNotificationsAsync()
        }
    }, [profile.authenticated])

    const refreshRooms = useCallback(_.debounce(() => {
        setRooms(client.getSessions().filter(r => !r.tags[hiddenTagName]))
        setInviteBadge(client.getRooms()
            .filter(i => client.isDirectRoom(i.roomId))
            .reduce((count, room) => count + (room.getMyMembership() === 'invite' ? 1 : 0), 0))
    }, 150), [client])

    useEffect(() => {
        refreshRooms()
        client.on(RoomEvent.Timeline, refreshRooms)
        client.on(RoomEvent.TimelineReset, refreshRooms)
        client.on(RoomEvent.Receipt, refreshRooms)
        client.on(ClientEvent.Room, refreshRooms)
        client.on(ClientEvent.DeleteRoom, refreshRooms)
        client.on(RoomEvent.MyMembership, refreshRooms)
        client.on(RoomEvent.Tags, refreshRooms)
        client.on(RoomEvent.Name, refreshRooms)

        return () => {
            client.off(RoomEvent.Timeline, refreshRooms)
            client.off(RoomEvent.TimelineReset, refreshRooms)
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
                        {(avatar_url)
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
                            <ListItem.Title lineBreakMode='clip' numberOfLines={1} style={{ fontSize: globalStyle.titleFontStyle.fontSize, fontWeight: '600' }}>{title}</ListItem.Title>
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

    const headerRight = useMemo(() => <View style={{ flexDirection: 'row' }}>
        <Icon color={theme.colors.background} onPress={() => navigation.push('SearchMessage')} name='search' type='feather' style={{ marginHorizontal: 14 }}></Icon>
        <Menu>
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
        </Menu>
    </View>, [inviteBadge])

    const handleQrCode = (scanValue) => {
        if (scanValue.startsWith('!')) {
            navigation.push('RoomPreview', { id: scanValue })
            return
        }
        if (scanValue.startsWith('@')) {
            navigation.push('Member', { userId: scanValue })
            return
        }
        Linking.canOpenURL(scanValue).then(can => {
            if (can) {
                Linking.openURL(scanValue)
            } else {
                Toast.show(scanValue)
            }
        })
    }

    const onBarcodeScanned = (res: BarcodeScanningResult) => {
        setOpenQrCode(false)
        handleQrCode(res.data)
    }

    const onBarcodeFromGalley = async () => {
        setOpenQrCode(false)
        const picked = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            aspect: [4, 3],
            quality: 1,
            allowsMultipleSelection: false,
            selectionLimit: 9
        })

        if (!picked.canceled) {
            const result = await RNQRGenerator.detect({
                uri: picked.assets[0].uri
            })
            handleQrCode(result.values[0])
        }
    }

    return <View style={styles.container}>
        <BpayHeader title='聊天'
            rightComponent={headerRight}></BpayHeader>
        <Qrcode isVisible={openQrCode} onClose={() => {
            setOpenQrCode(false)
        }} onBarcodeScanned={onBarcodeScanned} onBarcodeFromGalley={onBarcodeFromGalley}></Qrcode>
        {profile.authenticated ? <View style={styles.content}>
            <FlatList data={rooms} renderItem={renderItem} onRefresh={refreshRooms} refreshing={refreshing}
                ListEmptyComponent={<View style={{ alignItems: 'center', marginTop: 200 }}>
                    <Image style={{ width: 100, height: 100, opacity: 0.3 }} source={require('../../assets/icon.png')}></Image>
                    <Text style={{ fontSize: 16, color: 'grey' }}>暂无聊天记录</Text>
                </View>}>
            </FlatList>
        </View> :
            <Overlay isVisible={true} fullScreen
                overlayStyle={{ backgroundColor: 'transparent' }}
                backdropStyle={{ opacity: 0.4 }}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text>登录后查看更多功能</Text>
                    <Button title={'登录'} buttonStyle={{ borderRadius: 10, paddingHorizontal: 20 }}
                        onPress={() => navigation.replace('Login')}
                        size='md' containerStyle={{ padding: 10 }}></Button>
                </View>
            </Overlay>
        }
    </View>
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { backgroundColor: '#ffffff', flex: 1 },
})

export default Session