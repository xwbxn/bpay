import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import {
    Icon, Switch, useTheme
} from '@rneui/themed';

import { useGlobalState } from '../../../store/globalContext';
import { useMatrixClient } from '../../../store/useMatrixClient';
import { IListItem } from '../components/ListView';
import { IMemberItem, MemberList } from './components/MemberList';
import { IPropEditorProps, PropEditor } from '../components/PropEditor';
import { Direction, EventType, JoinRule, RoomMember, RoomStateEvent, Visibility } from 'matrix-js-sdk';
import { ISettingItem, SettingList } from './components/SettingList';

export const RoomSetting = ({ navigation, route }) => {

    const { setLoading } = useGlobalState()
    const { id } = route.params
    const { client } = useMatrixClient()
    const [room, setRoom] = useState(client.getRoom(id))
    const [member, setMember] = useState<RoomMember>()
    const [roomVisibility, setRoomVisibility] = useState(false)
    const isFriendRoom = client.isFriendRoom(id)
    const { theme } = useTheme()
    const [roomMembers, setRoomMembers] = useState<IMemberItem[]>([])
    const [roomOnTop, setRoomOnTop] = useState(client.isRoomOnTop(id))
    const [roomPowerLevel, setRoomPowerLevel] = useState<{ [id: string]: any }>()

    const [editProps, setEditProps] = useState<IPropEditorProps>({ isVisible: false })

    useEffect(() => {
        setRoom(client.getRoom(id))
    }, [client.getRoom(id)])


    useEffect(() => {
        // set nav bar
        navigation.setOptions({
            title: `聊天设置`
        })
    }, [])

    useEffect(() => {
        if (!room) {
            return
        }
        const powerLevel = room.getLiveTimeline().getState(Direction.Forward).getStateEvents(EventType.RoomPowerLevels)
        if (powerLevel.length > 0) {
            setRoomPowerLevel({ ...powerLevel[0].getContent() })
        }
        setMember(room.getMember(client.getUserId()))

        function refreshMembers() {
            setRoomMembers(room.getJoinedMembers().map(i => {
                console.log('i.name, i.', i.name, i.powerLevel)
                return {
                    id: i.userId,
                    name: i.name,
                    avatar: i.getAvatarUrl(client.baseUrl, 50, 50, 'crop', true, true)
                };
            }));
        }
        refreshMembers();

        room.on(RoomStateEvent.Members, refreshMembers)
        return () => {
            room.off(RoomStateEvent.Members, refreshMembers)
        }
    }, [room])

    const leaveGroup = () => {
        Alert.alert("确认", "是否要退出群聊?", [
            {
                text: '取消',
                onPress: () => console.log('Cancel Pressed'),
                style: 'cancel',
            },
            {
                text: '确认', onPress: async () => {
                    setLoading(true)
                    try {
                        await client.leave(room.roomId)
                        navigation.replace('Sessions')
                    } catch (e) {
                        Alert.alert('错误', e.toString())
                    } finally {
                        setLoading(false)
                    }
                }
            },
        ])
    }

    const onMemberPress = (item: IListItem) => {
        navigation.push('Member', { userId: item.id, roomId: room.roomId })
    }

    const onFriendToGroup = () => {
        const friend = roomMembers.filter(i => i.id !== client.getUserId())
        navigation.push('GroupChat', { initMembers: friend.map(i => i.id) })
    }

    const onInviteToGroup = () => {
        navigation.push('GroupChat', { initMembers: roomMembers.map(i => i.id), roomId: room.roomId })
    }

    const onTopChange = (value) => {
        setRoomOnTop(value)
        client.setRoomOnTop(room.roomId, value)
    }

    const onRoomPublic = async (value) => {
        try {
            setLoading(true)
            setRoomVisibility(value)
            await client.sendStateEvent(room.roomId, EventType.RoomJoinRules, { join_rule: value ? JoinRule.Public : JoinRule.Invite })
            await client.setRoomDirectoryVisibility(room.roomId, value ? Visibility.Public : Visibility.Private)
        }
        catch (e) {
            Alert.alert('错误', e.toString())
            console.error('onRoomPublic', e)
        }
        finally {
            setLoading(false)
        }
    }

    const setRoomName = () => {
        if (member.powerLevel < roomPowerLevel.events[EventType.RoomName]) {
            Alert.alert('提示', "您无权限修改名称")
            return
        }
        setEditProps({
            isVisible: true,
            title: '设置群聊名称',
            props: {
                name: {
                    title: '名称',
                    value: room.name
                }
            },
            onSave(props) {
                setLoading(true)
                client.setRoomName(room.roomId, props.name.value)
                    .then(() => {
                        setEditProps({ isVisible: false })
                        room.name = props.name.value
                    })
                    .catch(e => {
                        Alert.alert('错误', e.toString())
                    }).finally(() => {
                        setLoading(false)
                    })
            },
            onCancel() {
                setEditProps({ isVisible: false })
            },
        })
    }

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: '#f5f5f5' },
        content: { backgroundColor: '#ffffff', marginBottom: 12, paddingHorizontal: 10 },
        listItem: { margin: 0, paddingVertical: 14 },
        listItemTitle: { fontSize: 20 },
        listItemText: { fontSize: 20, color: theme.colors.grey2 }
    })


    const friendSettingItems: ISettingItem[] = [
        {
            title: '查找聊天记录'
        },
        {
            title: '消息免打扰',
            right: () => <Switch style={{ height: 20 }}></Switch>,
            breakTop: true
        },
        {
            title: '置顶聊天',
            right: () => <Switch value={roomOnTop} onValueChange={onTopChange} style={{ height: 20 }}></Switch>
        }
    ]

    const groupSettingItems: ISettingItem[] = [
        {
            title: '群聊名称',
            text: room.name,
            onPress: setRoomName
        },
        {
            title: '群二维码',
            right: () => <Icon size={20} name='qrcode' type='material-community' color={theme.colors.grey2}></Icon>,
        },
        {
            title: '群公告',
            text: '群公告',
        },
        {
            title: '公共群组',
            right: () => <Switch value={roomVisibility} onValueChange={onRoomPublic} style={{ height: 20 }}></Switch>,
        },
        {
            title: '群管理',
            onPress: () => {
                console.log(roomPowerLevel)
            }
        },
        {
            title: '查找聊天记录',
            breakTop: true
        },
        {
            title: '群文件',
        },
        {
            title: '消息免打扰',
            right: () => <Switch style={{ height: 20 }}></Switch>,
            breakTop: true
        },
        {
            title: '置顶聊天',
            right: () => <Switch value={roomOnTop} onValueChange={onTopChange} style={{ height: 20 }}></Switch>,
        },
        {
            title: '退出群聊',
            onPress: leaveGroup,
            breakTop: true,
            titleStyle: { color: theme.colors.error, alignItems: 'center' },
            titleContainerStyle: { alignItems: 'center' },
            hideChevron: true
        }
    ]

    const groupSetting = room && <View style={styles.container}>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <MemberList containerStyle={{ paddingVertical: 20 }} items={roomMembers}
                onSetting={onInviteToGroup}
                onItemPress={onMemberPress}></MemberList>
        </View>
        <SettingList items={groupSettingItems}></SettingList>
    </View >

    const friendSetting = room && <View style={styles.container}>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <MemberList containerStyle={{ paddingVertical: 20 }} onItemPress={onMemberPress}
                onSetting={onFriendToGroup}
                items={roomMembers.filter(i => i.id !== client.getUserId())}></MemberList>
        </View>
        <SettingList items={friendSettingItems}></SettingList>
    </View>

    return <>
        <PropEditor editProps={editProps}></PropEditor>
        <ScrollView>
            {isFriendRoom ? friendSetting : groupSetting}
        </ScrollView>
    </>
}