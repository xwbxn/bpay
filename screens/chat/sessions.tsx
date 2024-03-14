import 'moment/locale/zh-cn';

import { ClientEvent, Room, RoomEvent } from 'matrix-js-sdk';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { Avatar, Badge, Divider, Icon, Text, useTheme } from '@rneui/themed';

import { favTagName, hiddenTagName, useMatrixClient } from '../../store/useMatrixClient';
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
                marginLeft: 12
            },
            buttonItem: {
                flexDirection: 'row',
                justifyContent: 'center',
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
                        <MenuOption onSelect={() => { onDirectPress() }}>
                            <View style={menuStyles.buttonItem}>
                                <Icon name='comment' type='octicon' color={theme.colors.white}></Icon>
                                <Text style={menuStyles.titleStyle}>我的好友</Text>
                            </View>
                        </MenuOption>
                        <Divider style={{ width: '100%' }}></Divider>
                        <MenuOption>
                            <View style={menuStyles.buttonItem}>
                                <Icon name='comment-discussion' type='octicon' color={theme.colors.white}></Icon>
                                <Text style={menuStyles.titleStyle}>我的群组</Text>
                            </View>
                        </MenuOption>
                    </MenuOptions>
                </Menu>
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
                    if (a.tags[favTagName] && !b.tags[favTagName]) {
                        return -1
                    } else if (!a.tags[favTagName] && b.tags[favTagName]) {
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

        return () => {
            client.off(RoomEvent.Timeline, refreshRooms)
            client.off(RoomEvent.Receipt, refreshRooms)
            client.off(ClientEvent.Room, refreshRooms)
            client.off(ClientEvent.DeleteRoom, refreshRooms)
            client.off(RoomEvent.MyMembership, refreshRooms)
            client.off(RoomEvent.Tags, refreshRooms)
        }
    }, [])


    const onDirectPress = () => {
        navigation.push('Invite')
    }

    const onRoomPress = () => {
        navigation.push('Invite')
    }

    const onPressRoom = (item) => {
        navigation.push('Room', {
            id: item.roomId
        })
    }

    const toggleFavor = (item: Room) => {
        if (item.tags[favTagName]) {
            client.deleteRoomTag(item.roomId, favTagName)
        } else {
            client.setRoomTag(item.roomId, favTagName, {})
        }
    }

    const handleHide = (item) => {
        client.setRoomTag(item.roomId, hiddenTagName, {})
    }

    const renderItem = ({ item }: { item: Room }) => {
        const lastEvt = item.getLastLiveEvent()
        const isFavor = Boolean(item.tags[favTagName])
        return (
            <Menu>
                <MenuTrigger triggerOnLongPress onAlternativeAction={() => onPressRoom(item)}>
                    <View style={{
                        flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8,
                        backgroundColor: isFavor ? theme.colors.grey5 : undefined
                    }}>
                        <View>
                            <Avatar size={50} rounded title={item.name[0]} containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
                            {item.getUnreadNotificationCount() > 0
                                && <Badge value={item.getUnreadNotificationCount()} status="error" containerStyle={{ position: 'absolute', top: -5, left: 35 }}></Badge>}
                        </View>
                        <View style={{ flex: 1, justifyContent: 'space-between', paddingLeft: 8 }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.name}</Text>
                            <Text style={{ fontSize: 14, color: theme.colors.grey3 }}>{lastEvt?.getContent().body?.slice(0, 20)}</Text>
                        </View>
                        <View style={{ paddingTop: 10 }}>
                            <Text style={{ fontSize: 12, color: theme.colors.grey3 }}>{moment(lastEvt?.localTimestamp).fromNow()}</Text>
                        </View>
                    </View>
                    <Divider style={{ width: "100%", borderColor: theme.colors.primary }}></Divider>
                </MenuTrigger>
                <MenuOptions customStyles={{ optionsContainer: { marginLeft: 100, marginTop: 20 } }}>
                    <MenuOption onSelect={() => toggleFavor(item)} text={isFavor ? '取消置顶' : '置顶'} customStyles={{
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