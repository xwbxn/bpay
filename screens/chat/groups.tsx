import { ClientEvent, EventType, Preset, User } from 'matrix-js-sdk';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { Icon, ListItem } from '@rneui/base';
import { Avatar, BottomSheet, Button, Input, SearchBar, Text, useTheme } from '@rneui/themed';

import { useMatrixClient } from '../../store/useMatrixClient';

export const GroupChat = ({ navigation }) => {

    useEffect(() => {
        // set nav bar
        navigation.setOptions({
            title: '发起群聊'
        })
    }, [])

    const { theme } = useTheme()
    const { client } = useMatrixClient()
    const [searchVal, setSearchVal] = useState('')
    const [members, setMembers] = useState<{ user: User, roomId: string, checked: boolean }[]>([])
    const [isGroupOptionVisible, setIsGroupOptionVisible] = useState(false)
    const [groupName, setGroupName] = useState('')
    const [groupTopic, setGroupTopic] = useState('')
    const [nameError, setNameError] = useState('')

    useEffect(() => {
        const refreshContacts = () => {
            const joinedRooms = client.getRooms().filter(room => {
                return (
                    room.getMyMembership() === 'join' &&
                    room.getInvitedAndJoinedMemberCount() === 2 &&
                    room.getJoinedMemberCount() == 2 &&
                    room.getMembers().some(m => m.getDMInviter() !== undefined)
                )
            })
            const _members = []
            joinedRooms.forEach(room => {
                const member = room.getJoinedMembers().find(m => m.userId !== room.myUserId)
                _members.push({
                    user: client.getUser(member.userId),
                    roomId: room.roomId,
                    checked: false
                })
            })
            setMembers(_members)
        }

        refreshContacts()
        client.on(ClientEvent.DeleteRoom, refreshContacts)
        return () => {
            client.off(ClientEvent.DeleteRoom, refreshContacts)
        }
    }, [])

    const searchUser = (search) => {
        setSearchVal(search)
    }

    const onCreateGroup = () => {
        if (members.filter(m => m.checked).length == 0) {
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
        client.createRoom({
            is_direct: false,
            preset: Preset.PrivateChat,
            invite: members.filter(m => m.checked).map(m => m.user.userId),
            name: groupName,
            topic: groupTopic
        }).then((res) => {
            navigation.replace('Room', {
                id: res.room_id
            })
        })
    }

    return <View style={styles.container}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff' }}>
            <SearchBar
                containerStyle={{ flex: 1, borderWidth: 0, borderColor: theme.colors.background, backgroundColor: theme.colors.background, paddingHorizontal: 12 }}
                inputContainerStyle={{ backgroundColor: theme.colors.grey5 }}
                round
                value={searchVal}
                placeholder='搜索联系人'
                onChangeText={searchUser}
            ></SearchBar>
            <Button title={'建群'} radius={15} onPress={onCreateGroup}
                titleStyle={{ fontSize: 18 }} containerStyle={{ backgroundColor: '#ffffff', marginRight: 10 }}></Button>
        </View>
        <View style={{ paddingHorizontal: 10, ...styles.content }}>
            <ScrollView>
                <ListItem.Accordion content={
                    <>
                        <ListItem.Content>
                            <ListItem.Title>选择联系人(已选{members.filter(m => m.checked).length}人)</ListItem.Title>
                        </ListItem.Content>
                    </>
                } isExpanded>
                    {(searchVal !== '' ?
                        members.filter(m => m.user.userId.includes(searchVal) ||
                            m.user.displayName.includes(searchVal)) : members)
                        .map(m => {
                            return (
                                <ListItem topDivider bottomDivider key={m.user.userId}
                                    onPress={() => {
                                        m.checked = !m.checked
                                        setMembers([...members])
                                    }}                                >
                                    <ListItem.CheckBox checked={m.checked} onPress={() => {
                                        m.checked = !m.checked
                                        setMembers([...members])
                                    }}></ListItem.CheckBox>
                                    <Avatar size={50} rounded title={m.user.displayName[0]} containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
                                    <ListItem.Content>
                                        <ListItem.Title style={{ fontSize: 22 }}>{m.user.displayName}</ListItem.Title>
                                        <ListItem.Subtitle>{m.user.userId} {m.roomId}</ListItem.Subtitle>
                                    </ListItem.Content>
                                    <ListItem.Chevron></ListItem.Chevron>
                                </ListItem>)
                        })}
                </ListItem.Accordion>
            </ScrollView>
        </View>
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