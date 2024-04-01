import { ClientEvent } from 'matrix-js-sdk';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { Button, SearchBar, useTheme } from '@rneui/themed';

import { useGlobalState } from '../../store/globalContext';
import { useMatrixClient } from '../../store/useMatrixClient';
import { IListItem, ListView } from './components/ListView';
import { randomUUID } from 'expo-crypto';

const membershipMap = {
    'leave': '已删除',
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

    const acceptInvite = async (userId, roomId) => {
        await client.acceptDirect(userId, roomId)
        setRefreshKey(randomUUID())
    }

    const rejectInvite = async (roomId) => {
        client.getRoom(roomId).updateMyMembership('leave')
        await client.leave(roomId)
        setRefreshKey(randomUUID())
    }

    useEffect(() => {
        const refreshContacts = () => {
            // 新的朋友
            const _newFriends: IListItem[] = []
            const news = client.getRooms()
                .filter(room => client.isDirectInvitingRoom(room.roomId))
                .filter(room => room.getMyMembership() === 'invite')
            news.forEach(room => {
                console.log('room', room.roomId, room.name, room.getInvitedAndJoinedMemberCount())
                const me = room.getMember(client.getUserId())
                const invitor = room.getMember(room.guessDMUserId())
                const reason = me.events.member?.getContent()?.reason
                room.updateMyMembership
                _newFriends.push({
                    id: invitor.userId,
                    title: invitor.name,
                    subtitle: reason,
                    avatar: invitor.getAvatarUrl(client.baseUrl, 50, 50, 'scale', true, true),
                    data: { roomId: room.roomId },
                    right: <>
                        <Button titleStyle={{ color: theme.colors.error }} type='clear' title={'拒绝'} onPress={() => rejectInvite(room.roomId)}></Button>
                        <Button type='clear' title={'同意'} onPress={() => acceptInvite(invitor.userId, room.roomId)}></Button>
                    </>
                })
            })
            setNewFriends(_newFriends)

            // 好友
            const _friends = client.getFriends().filter(i => i.membership === 'join')
            setFriends(_friends.map(i => ({
                id: i.userId,
                title: i.name,
                subtitle: i.userId,
                avatar: i.avatar_url,
                right: membershipMap[i.membership] || '',
                data: { roomId: i.roomId },
            })))

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

        refreshContacts()
        client.on(ClientEvent.DeleteRoom, refreshContacts)
        return () => {
            client.off(ClientEvent.DeleteRoom, refreshContacts)
        }
    }, [refreshKey])

    const searchUser = () => {
        const fullId = /@(.*):chat\.b-pay\.life/.test(searchVal) ? searchVal : `@${searchVal}:chat.b-pay.life`
        if (friends.map(i => i.id).includes(fullId)) {
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
                <ListView items={newFriends} accordion accordionTitle='新的朋友'></ListView>
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