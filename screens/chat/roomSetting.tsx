import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import {
    Divider, Icon, ListItem, Switch, Text, useTheme
} from '@rneui/themed';

import { useGlobalState } from '../../store/globalContext';
import { useMatrixClient } from '../../store/useMatrixClient';
import { IListItem } from './components/ListView';
import { IMemberItem, MemberList } from './components/MemberList';
import { IPropEditorProps, PropEditor } from './components/PropEditor';
import { ClientEvent, Direction, EventType, IContent, JoinRule, RoomEvent, RoomMemberEvent, RoomStateEvent, Visibility } from 'matrix-js-sdk';

export const RoomSetting = ({ navigation, route }) => {

    const { setLoading } = useGlobalState()
    const { id } = route.params
    const { client } = useMatrixClient()
    const [room, setRoom] = useState(client.getRoom(id))
    const [roomVisibility, setRoomVisibility] = useState(false)
    // const room = client.getRoom(id)
    const isFriendRoom = client.isFriendRoom(id)
    const { theme } = useTheme()
    const [roomMembers, setRoomMembers] = useState<IMemberItem[]>([])
    const [roomOnTop, setRoomOnTop] = useState(client.isRoomOnTop(id))

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
        setRoomVisibility(room.getLiveTimeline().getState(Direction.Forward).getJoinRule() === JoinRule.Public)
        function refreshMembers() {
            setRoomMembers(room.getJoinedMembers().map(i => {
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
        listItem: { margin: 0, paddingVertical: 15 },
        listItemTitle: { fontSize: 20 },
        listItemText: { fontSize: 20, color: theme.colors.grey2 }
    })

    const groupSetting = room && <View style={styles.container}>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <MemberList containerStyle={{ paddingVertical: 20 }} items={roomMembers}
                onSetting={onInviteToGroup}
                onItemPress={onMemberPress}></MemberList>
        </View>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <ListItem containerStyle={styles.listItem} onPress={setRoomName}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>群聊名称</ListItem.Title>
                </ListItem.Content>
                <Text style={styles.listItemText}>{room.name}</Text>
                <ListItem.Chevron></ListItem.Chevron>
            </ListItem>
            <Divider></Divider>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>群二维码</ListItem.Title>
                </ListItem.Content>
                <Icon size={20} name='qrcode' type='material-community' color={theme.colors.grey2}></Icon>
                <ListItem.Chevron></ListItem.Chevron>
            </ListItem>
            <Divider></Divider>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>群公告</ListItem.Title>
                </ListItem.Content>
                <Text style={styles.listItemText}>{'群公告'}</Text>
                <ListItem.Chevron></ListItem.Chevron>
            </ListItem>
            <Divider></Divider>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>公共群组</ListItem.Title>
                </ListItem.Content>
                <Switch value={roomVisibility} onValueChange={onRoomPublic} style={{ height: 20 }}></Switch>
            </ListItem>
            <Divider></Divider>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>备注</ListItem.Title>
                </ListItem.Content>
                <Text style={styles.listItemText}>{'备注'}</Text>
                <ListItem.Chevron></ListItem.Chevron>
            </ListItem>
        </View>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>查找聊天记录</ListItem.Title>
                </ListItem.Content>
                <ListItem.Chevron></ListItem.Chevron>
            </ListItem>
            <Divider></Divider>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>群文件</ListItem.Title>
                </ListItem.Content>
                <ListItem.Chevron></ListItem.Chevron>
            </ListItem>
        </View>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>消息免打扰</ListItem.Title>
                </ListItem.Content>
                <Switch style={{ height: 20 }}></Switch>
            </ListItem>
            <Divider></Divider>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>置顶聊天</ListItem.Title>
                </ListItem.Content>
                <Switch value={roomOnTop} onValueChange={onTopChange} style={{ height: 20 }}></Switch>
            </ListItem>
        </View>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <ListItem containerStyle={styles.listItem} onPress={leaveGroup}>
                <ListItem.Content style={{ alignItems: 'center' }}>
                    <ListItem.Title style={{ ...styles.listItemTitle, color: theme.colors.error }}>退出群聊</ListItem.Title>
                </ListItem.Content>
            </ListItem>
        </View>
    </View >

    const friendSetting = room && <View style={styles.container}>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <MemberList containerStyle={{ paddingVertical: 20 }} onItemPress={onMemberPress}
                onSetting={onFriendToGroup}
                items={roomMembers.filter(i => i.id !== client.getUserId())}></MemberList>
        </View>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>查找聊天记录</ListItem.Title>
                </ListItem.Content>
                <ListItem.Chevron></ListItem.Chevron>
            </ListItem>
        </View>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>消息免打扰</ListItem.Title>
                </ListItem.Content>
                <Switch style={{ height: 20 }}></Switch>
            </ListItem>
            <Divider></Divider>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>置顶聊天</ListItem.Title>
                </ListItem.Content>
                <Switch value={roomOnTop} onValueChange={onTopChange} style={{ height: 20 }}></Switch>
            </ListItem>
        </View>
    </View>

    return <>
        <PropEditor editProps={editProps}></PropEditor>
        <ScrollView>
            {isFriendRoom ? friendSetting : groupSetting}
        </ScrollView>
    </>
}