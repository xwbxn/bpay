import { ClientEvent, Direction, EventType, RoomEvent, RoomMember, RoomMemberEvent } from 'matrix-js-sdk';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { Button, SearchBar, useTheme } from '@rneui/themed';

import { useGlobalState } from '../../store/globalContext';
import { useMatrixClient } from '../../store/useMatrixClient';
import { IListItem, ListView } from './components/ListView';
import { randomUUID } from 'expo-crypto';

const membershipMap = {
    'leave': '无效',
    'join': '',
    'invite': '邀请中'
}

export const Contacts = ({ navigation, route }) => {

    useEffect(() => {
        // set nav bar
        navigation.setOptions({
            title: '联系人'
        })
    }, [])

    const { setLoading } = useGlobalState()
    const { theme } = useTheme()
    const { client } = useMatrixClient()
    const [refreshKey, setRefreshKey] = useState(randomUUID())
    const [searchVal, setSearchVal] = useState("");
    const [searchMembers, setSearchMembers] = useState<IListItem[]>([])
    const [newFriends, setNewFriends] = useState<IListItem[]>([])
    const [friends, setFriends] = useState<IListItem[]>([])
    const [groups, setGroups] = useState<IListItem[]>([])
    const [publicGroups, setPublicGroups] = useState<IListItem[]>([])
    const [joinedRooms, setJoinedRooms] = useState([])

    const acceptInvite = async (userId, roomId) => {
        await client.acceptDirect(userId, roomId)
        setRefreshKey(randomUUID())
    }

    const rejectInvite = async (userId, roomId) => {
        await client.rejectDirect(userId, roomId)
        setRefreshKey(randomUUID())
    }

    const cancelInvite = async (userId, roomId) => {
        await client.cancelDirect(userId, roomId)
        setRefreshKey(randomUUID())
    }

    useEffect(() => {
        client.getJoinedRooms().then(res => {
            console.log('res.', res.joined_rooms)
            setJoinedRooms(res.joined_rooms)
        })
    }, [])


    const refreshContacts = () => {
        setSearchVal('')
        setSearchMembers([])

        client.getRooms().forEach(r => {
            console.log('r.', r.getCreator())
            console.log('r.', r.roomId, r.name, client.isDirectRoom(r.roomId),
                JSON.stringify(r.getMembers().map(i => [i.powerLevel, i.name, i.membership, i.events.member.getContent()])))
        })
        // 新的朋友
        const _newFriends: IListItem[] = []
        const news = client.getRooms()
            .filter(room => client.isDirectRoom(room.roomId))
            .filter(room => room.getMyMembership() === 'invite' // 别人邀请我
                || (room.getMyMembership() === 'join' && room.getMember(room.guessDMUserId()).membership === 'invite') // 我邀请别人
                || (room.getMyMembership() === 'join' && room.getMember(room.guessDMUserId()).membership === 'leave'
                    && room.getMember(room.guessDMUserId()).events.member.getPrevContent().membership === 'invite')// 别人拒绝了
                || (room.getMyMembership() === 'leave'
                    && room.getMember(client.getUserId()).events.member.getPrevContent().membership === 'invite'
                    && room.getMember(room.guessDMUserId()).membership === 'join')) //别人取消了
        news.forEach(room => {
            const { invitor, invitee, reason } = room.getLiveTimeline().getState(Direction.Forward).getStateEvents(EventType.RoomCreate)[0].getContent()[EventType.Direct]
            const me = room.getMember(client.getUserId())
            const friend = room.getMember(room.guessDMUserId())
            let subTitle
            let right
            if (invitor === me.userId && friend.membership === 'invite') {
                subTitle = '[已发送好友邀请]'
                right = <Button titleStyle={{ color: theme.colors.error }} type='clear' title={'取消'}
                    onPress={() => cancelInvite(friend.userId, room.roomId)}></Button>
            } else if (invitor === me.userId && friend.membership === 'leave' && friend.events.member.getPrevContent().membership === 'invite') {
                subTitle = '[对方已拒绝邀请]'
                right = <><Button titleStyle={{ color: theme.colors.error }} type='clear' title={'取消'}
                    onPress={() => cancelInvite(friend.userId, room.roomId)}></Button>
                    <Button type='clear' title={'邀请'} onPress={async () => {
                        await cancelInvite(friend.userId, room.roomId)
                        navigation.push('Member', { userId: friend.userId })
                    }}></Button></>
            } else if (invitee === me.userId && me.membership === 'leave') {
                subTitle = '[已失效]'
                right = <Button titleStyle={{ color: theme.colors.error }} type='clear' title={'删除'}
                    onPress={() => {
                        client.forget(room.roomId)
                    }}></Button>
            }
            else {
                subTitle = reason
                right = <>
                    <Button titleStyle={{ color: theme.colors.error }} type='clear' title={'拒绝'}
                        onPress={() => rejectInvite(friend.userId, room.roomId)}></Button>
                    <Button type='clear' title={'同意'}
                        onPress={() => acceptInvite(friend.userId, room.roomId)}></Button>
                </>
            }

            _newFriends.push({
                id: friend.userId,
                title: friend.name,
                subtitle: subTitle,
                avatar: friend.getAvatarUrl(client.baseUrl, 50, 50, 'scale', true, true),
                data: { roomId: room.roomId },
                right: right
            })
        })
        setNewFriends(_newFriends)

        // 好友
        const _friends = client.getRooms()
            .filter(room => room.getMyMembership() === 'join')
            .filter(room => client.isDirectRoom(room.roomId))
            .filter(room => room.getMyMembership() === 'join' && (room.getMember(room.guessDMUserId()).membership === 'join' // 正常聊天
                || (room.getMember(room.guessDMUserId()).membership === 'leave'
                    && room.getMember(room.guessDMUserId()).events.member.getPrevContent().membership === 'join')) // 别人退了
            )

        // .filter(room => ['join', 'leave'].includes(client.getDirect(room.roomId)?.status))
        setFriends(_friends.map(room => {
            const friend = room.getMember(room.guessDMUserId())
            return {
                id: friend.userId,
                title: friend.name,
                subtitle: friend.userId,
                avatar: friend.getAvatarUrl(client.baseUrl, 40, 40, 'scale', true, true),
                right: membershipMap[friend.membership] || '',
                data: { roomId: room.roomId },
            }
        }))

        // 群组
        const _groups: IListItem[] = []
        const joindGroups = client.getRooms()
            .filter(room => room.getMyMembership() === 'join')
            .filter(room => !client.isDirectRoom(room.roomId))
        joindGroups.forEach(room => {
            _groups.push({
                id: room.roomId,
                title: room.name,
                subtitle: room.normalizedName,
                avatar: room.getAvatarUrl(client.baseUrl, 50, 50, 'scale')
            })
        })
        setGroups(_groups)

        // 公共群组
        const _publicRooms: IListItem[] = []
        client.publicRooms().then(res => {
            res.chunk.forEach(room => {
                _publicRooms.push({
                    id: room.room_id,
                    title: room.name,
                    subtitle: room.topic,
                    avatar: client.mxcUrlToHttp(room.avatar_url, 50, 50, 'scale'),
                    right: room.join_rule
                })
            })
            setPublicGroups(_publicRooms)
        })
    }

    useEffect(() => {
        refreshContacts()
    }, [refreshKey, joinedRooms])

    useEffect(() => {
        client.on(ClientEvent.DeleteRoom, refreshContacts)
        client.on(ClientEvent.Room, refreshContacts)
        client.on(RoomEvent.Tags, refreshContacts)
        return () => {
            client.off(ClientEvent.DeleteRoom, refreshContacts)
            client.off(ClientEvent.Room, refreshContacts)
            client.off(RoomEvent.Tags, refreshContacts)
        }
    })

    const searchUser = () => {
        const fullId = /@(.*):chat\.b-pay\.life/.test(searchVal) ? searchVal : `@${searchVal}:chat.b-pay.life`
        if (friends.map(i => i.id).includes(fullId)
            || newFriends.map(i => i.id).includes(fullId)
            || fullId === client.getUserId()) {
            setSearchMembers([])
        } else {
            setLoading(true)
            client.getProfileInfo(fullId).then(res => {
                setSearchMembers([{
                    id: fullId,
                    title: res?.displayname || fullId,
                    subtitle: fullId,
                    avatar: client.mxcUrlToHttp(res?.avatar_url)
                }])
            }).catch(e => {
                if (e.errcode === 'M_NOT_FOUND') {
                    Alert.alert('提示', '用户不存在')
                }
                console.log('e', JSON.stringify(e))
            }).finally(() => {
                setLoading(false)
            })
        }
    }

    const onPressMember = (m: IListItem) => {
        navigation.push('Member', { userId: m.id, roomId: m.data.roomId })
    }

    const onPressGroup = (g: IListItem) => {
        navigation.replace('Room', { id: g.id })
    }

    const onPressPublicGroup = async (g: IListItem) => {
        setLoading(true)
        try {
            await client.joinRoom(g.id as string)
            navigation.replace('Room', { id: g.id })
        } catch (e) {
            Alert.alert('错误', e.toString())
        } finally {
            setLoading(false)
        }
    }

    const onPressSearchMember = (m: IListItem) => {
        navigation.push('Member', { userId: m.id })
    }

    return <View style={styles.container}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff' }}>
            <SearchBar
                containerStyle={{ flex: 1, borderWidth: 0, borderColor: theme.colors.background, backgroundColor: theme.colors.background, paddingHorizontal: 12 }}
                inputContainerStyle={{ backgroundColor: theme.colors.grey5 }}
                round
                placeholder='搜索'
                value={searchVal}
                onChangeText={setSearchVal}
                onSubmitEditing={() => { searchUser() }}
            ></SearchBar>
            <Button title={'搜索'} radius={15} onPress={searchUser}
                titleStyle={{ fontSize: 18 }} containerStyle={{ backgroundColor: '#ffffff', marginRight: 10 }}></Button>
        </View>
        <View style={{ paddingHorizontal: 10, ...styles.content }}>
            <ScrollView>
                {searchMembers.length > 0 &&
                    <ListView items={searchMembers} onPressItem={onPressSearchMember} accordion accordionTitle='陌生人'></ListView>}
                {newFriends.length > 0 && <ListView items={newFriends} accordion accordionTitle='新的朋友'></ListView>}
                <ListView search={searchVal} items={publicGroups} onPressItem={onPressPublicGroup} accordion accordionExpand={false} accordionTitle='公共群组'></ListView>
                <ListView search={searchVal} items={friends} onPressItem={onPressMember} accordion accordionTitle='我的好友'></ListView>
                <ListView search={searchVal} items={groups} onPressItem={onPressGroup} accordion accordionTitle='我加入的群组'></ListView>
            </ScrollView>
        </View>
    </View>
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { backgroundColor: '#ffffff', flex: 1 },
})