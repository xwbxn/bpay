import { Preset } from 'matrix-js-sdk';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { ListItem } from '@rneui/base';
import { Avatar, BottomSheet, Button, Input, SearchBar, Text, useTheme } from '@rneui/themed';

import { useGlobalState } from '../../store/globalContext';
import { useMatrixClient } from '../../store/useMatrixClient';
import { IListItem, ListView } from './components/ListView';

export const GroupChat = ({ navigation, route }) => {

    useEffect(() => {
        // set nav bar
        navigation.setOptions({
            title: '群成员'
        })
    }, [])

    const { setLoading } = useGlobalState()
    const { theme } = useTheme()
    const { client } = useMatrixClient()
    const roomId = route.params?.roomId
    const room = client.getRoom(roomId)
    const isFriendRoom = client.isFriendRoom(roomId)

    const [searchVal, setSearchVal] = useState('')
    const initMembers: string[] = route.params?.initMembers ? [...route.params.initMembers] : []
    const [members, setMembers] = useState<IListItem[]>([])
    const [selectedValue] = useState<string[]>(initMembers)
    const [isGroupOptionVisible, setIsGroupOptionVisible] = useState(false)
    const [groupName, setGroupName] = useState('')
    const [groupTopic, setGroupTopic] = useState('')
    const [nameError, setNameError] = useState('')

    useEffect(() => {
        const friends = client.getFriends()
        setMembers(friends.map(i => ({
            id: i.userId,
            title: i.name,
            subtitle: i.userId,
            avatar: i.avatar_url,
            right: i.membership
        })))
    }, [])

    const searchUser = (search) => {
        setSearchVal(search)
    }

    // 邀请或踢人
    const onSetMember = async () => {
        try {
            setLoading(true)
            const inviteMembers = selectedValue.filter(i => !initMembers.includes(i) && i !== client.getUserId())
            const removeMembers = initMembers.filter(i => !selectedValue.includes(i) && i !== client.getUserId())
            inviteMembers.forEach(async i => {
                await client.invite(roomId, i)
            })
            removeMembers.forEach(async i => {
                await client.kick(roomId, i)
            })
            navigation.goBack()
        } catch (e) {
            Alert.alert('错误', e.toString())
            console.error('onSetMember', e)
        } finally {
            setLoading(false)
        }
    }

    const onCreateGroup = () => {
        if (selectedValue.length == 0) {
            Alert.alert("至少需要选择一个联系人")
            return
        }
        setIsGroupOptionVisible(true)
    }

    const createGroup = () => {
        if (groupName === '') {
            setNameError('必填项')
            return
        }
        setLoading(true)
        client.createRoom({
            is_direct: false,
            preset: Preset.PrivateChat,
            invite: selectedValue,
            name: groupName,
            topic: groupTopic
        }).then((res) => {
            navigation.replace('Room', {
                id: res.room_id
            })
        }).catch(e => {
            Alert.alert('错误', e.toString())
        }).finally(() => {
            setLoading(false)
        })
    }

    return <View style={styles.container}>
        {room &&
            <View style={{ backgroundColor: theme.colors.background }}>
                <ListItem>
                    {room.getAvatarUrl(client.baseUrl, 80, 80, 'crop')
                        ? <Avatar size={80} rounded source={{ uri: room.getAvatarUrl(client.baseUrl, 80, 80, 'crop') }}
                            containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
                        : <Avatar size={80} rounded title={'群'}
                            containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>}
                    <ListItem.Content style={{ marginLeft: 10 }}>
                        <ListItem.Title style={{ fontSize: 24 }}>{room.name}</ListItem.Title>
                        <ListItem.Subtitle>{room.roomId}</ListItem.Subtitle>
                    </ListItem.Content>
                </ListItem>
            </View>}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff' }}>
            <SearchBar
                containerStyle={{ flex: 1, borderWidth: 0, borderColor: theme.colors.background, backgroundColor: theme.colors.background, paddingHorizontal: 12 }}
                inputContainerStyle={{ backgroundColor: theme.colors.grey5 }}
                round
                value={searchVal}
                placeholder='搜索联系人'
                onChangeText={searchUser}
            ></SearchBar>
        </View>
        <View style={{ paddingHorizontal: 10, ...styles.content }}>
            <ScrollView>
                <ListView items={members} search={searchVal} selectedValue={selectedValue} enableSelect multiSelect></ListView>
            </ScrollView>
        </View>
        <Button title={'确定'} onPress={(roomId === undefined || isFriendRoom) ? onCreateGroup : onSetMember}
            titleStyle={{ fontSize: 18 }} containerStyle={{ backgroundColor: '#ffffff', paddingHorizontal: 10, paddingBottom: 30 }}></Button>
        <BottomSheet modalProps={{}} isVisible={isGroupOptionVisible}>
            <ListItem>
                <ListItem>
                    <Text h4>确认群组设置</Text>
                </ListItem>
            </ListItem>
            <ListItem>
                <ListItem.Content>
                    <Input value={groupName} onChangeText={setGroupName} placeholder='群组名称(必填)' errorMessage={nameError}></Input>
                    <Input value={groupTopic} onChangeText={setGroupTopic} placeholder='群组话题(选填)'></Input>
                </ListItem.Content>
            </ListItem>
            <Button containerStyle={styles.buttonContainer} onPress={createGroup}>确定</Button>
            <Button containerStyle={styles.buttonContainer} color={'error'} onPress={() => setIsGroupOptionVisible(false)}>取消</Button>
        </BottomSheet>
    </View>
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { backgroundColor: '#ffffff', flex: 1 },
    buttonContainer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#ffffff'
    }
})