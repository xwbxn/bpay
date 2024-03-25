import { ClientEvent } from 'matrix-js-sdk';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { Button, SearchBar, useTheme } from '@rneui/themed';

import { useGlobalState } from '../../store/globalContext';
import { useMatrixClient } from '../../store/useMatrixClient';
import { IListItem, ListView } from './components/ListView';

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
    const [searchVal, setSearchVal] = useState("");
    const [searchMembers, setSearchMembers] = useState<IListItem[]>([])
    const [friends, setFriends] = useState<IListItem[]>([])
    const [groups, setGroups] = useState<IListItem[]>([])
    const [publicGroups, setPublicGroups] = useState<IListItem[]>([])

    useEffect(() => {
        const refreshContacts = () => {
            // 好友
            const _friends = client.getFriends()
            setFriends(_friends.map(i => ({
                id: i.userId,
                title: i.name,
                subtitle: i.userId,
                avatar: i.avatar_url,
                right: i.membership,
                data: { roomId: i.roomId }
            })))

            // 群组
            const _groups: IListItem[] = []
            const joindGroups = client.getRooms().filter(room => {
                return (
                    room.getMyMembership() === 'join' &&
                    (!_friends.map(i => i.roomId).includes(room.roomId))
                )
            })
            joindGroups.forEach(room => {
                _groups.push({
                    id: room.roomId,
                    title: room.name,
                    subtitle: room.normalizedName,
                    avatar: room.getAvatarUrl(client.baseUrl, 50, 50, 'crop')
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
                        avatar: room.avatar_url,
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
    }, [])

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
                    avatar: res?.avatar_url
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
                placeholder='搜索好友'
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
                <ListView search={searchVal} items={publicGroups} onPressItem={onPressPublicGroup} accordion accordionExpand={true} accordionTitle='公共群组'></ListView>
                <ListView search={searchVal} items={friends} onPressItem={onPressMember} accordion accordionTitle='联系人'></ListView>
                <ListView search={searchVal} items={groups} onPressItem={onPressGroup} accordion accordionTitle='我加入的群组'></ListView>
            </ScrollView>
        </View>
    </View>
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { backgroundColor: '#ffffff', flex: 1 },
})