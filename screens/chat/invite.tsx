import { ClientEvent, EventType, User } from 'matrix-js-sdk';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Icon, ListItem } from '@rneui/base';
import { Avatar, Button, SearchBar, useTheme } from '@rneui/themed';

import { useMatrixClient } from '../../store/useMatrixClient';

export const DirectChat = ({ navigation }) => {

    useEffect(() => {
        // set nav bar
        navigation.setOptions({
            title: '我的好友'
        })
    }, [])

    const { theme } = useTheme()
    const { client } = useMatrixClient()
    const [searchVal, setSearchVal] = useState("");
    const [inviteMembers, setInviteMembers] = useState<{ userId: string, displayName: string, avatarUrl: string, roomId?: string }[]>([])
    const [members, setMembers] = useState<{ user: User, roomId: string }[]>([])
    const [groups, setGroups] = useState<{ name: string, topic?: string, roomId: string, memberCount: number }[]>([])
    const [isExpandContact, setIsExpandContact] = useState(true)
    const [isExpandGroup, setIsExpandGroup] = useState(true)
    const [publicGroups, setPublicGroups] = useState<{ name: string, topic?: string, roomId: string, memberCount: number }[]>([])
    const [isExpandPublic, setIsExpandPublic] = useState(true)


    const updateSearch = (search) => {
        setSearchVal(search);
    };

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
                    roomId: room.roomId
                })
            })
            setMembers(_members)

            const _groups = []
            const joindGroups = client.getRooms().filter(room => {
                return (
                    room.getMyMembership() === 'join' &&
                    room.getMembers().every(m => m.getDMInviter() === undefined)
                )
            })
            joindGroups.forEach(room => {
                _groups.push({
                    name: room.name,
                    roomId: room.roomId,
                    memberCount: room.getJoinedMemberCount()
                })
            })
            setGroups(_groups)

            const _publicRooms = []
            client.publicRooms().then(res => {
                res.chunk.forEach(room => {
                    _publicRooms.push({
                        name: room.name,
                        roomId: room.room_id,
                        memberCount: room.num_joined_members,
                        topic: room.topic
                    })
                })
            })
            setPublicGroups(_publicRooms)

        }

        refreshContacts()
        client.on(ClientEvent.DeleteRoom, refreshContacts)
        return () => {
            client.off(ClientEvent.DeleteRoom, refreshContacts)
        }
    }, [])

    const searchUser = () => {
        const fullId = /@(.*):chat\.b-pay\.life/.test(searchVal) ? searchVal : `@${searchVal}:chat.b-pay.life`
        client.getProfileInfo(fullId).then(res => {
            console.log('res', res)
            setInviteMembers([{ userId: fullId, displayName: res?.displayname ?? fullId, avatarUrl: res?.avatar_url }])
        })
    }

    return <View style={styles.container}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff' }}>
            <SearchBar
                containerStyle={{ flex: 1, borderWidth: 0, borderColor: theme.colors.background, backgroundColor: theme.colors.background, paddingHorizontal: 12 }}
                inputContainerStyle={{ backgroundColor: theme.colors.grey5 }}
                round
                placeholder='搜索好友'
                value={searchVal}
                onChangeText={updateSearch}
                onSubmitEditing={() => { searchUser() }}
            ></SearchBar>
            <Button title={'搜索'} radius={15} onPress={searchUser}
                titleStyle={{ fontSize: 18 }} containerStyle={{ backgroundColor: '#ffffff', marginRight: 10 }}></Button>
        </View>
        <View style={{ paddingHorizontal: 10, ...styles.content }}>

            {inviteMembers.length > 0 &&
                <ListItem.Accordion content={
                    <>
                        <ListItem.Content>
                            <ListItem.Title>陌生人</ListItem.Title>
                        </ListItem.Content>
                    </>
                } isExpanded>
                    {inviteMembers.map(m => {
                        return (
                            <ListItem topDivider bottomDivider key={m.userId} onPress={() => {
                                navigation.push('Member', { userId: m.userId, roomId: m.roomId })
                            }}>
                                <Avatar size={50} rounded title={m.displayName[0]} containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
                                <ListItem.Content>
                                    <ListItem.Title style={{ fontSize: 22 }}>{m.displayName}</ListItem.Title>
                                    <ListItem.Subtitle>{m.userId} {m.roomId}</ListItem.Subtitle>
                                </ListItem.Content>
                                <ListItem.Chevron></ListItem.Chevron>
                            </ListItem>)
                    })}
                </ListItem.Accordion>}

            <ListItem.Accordion content={
                <>
                    <ListItem.Content>
                        <ListItem.Title>公共群组({publicGroups.length})</ListItem.Title>
                    </ListItem.Content>
                </>
            } onPress={() => setIsExpandPublic(!isExpandPublic)} isExpanded={isExpandPublic}>
                {(searchVal !== '' ?
                    publicGroups.filter(m => m.name.includes(searchVal)) : publicGroups).map(m => {
                        return (
                            <ListItem topDivider bottomDivider key={m.roomId} onPress={() => {
                                navigation.replace('Room', {
                                    id: m.roomId
                                })
                            }}>
                                <Avatar size={50} rounded title={'公'} containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
                                <ListItem.Content>
                                    <ListItem.Title style={{ fontSize: 22 }}>{m.name}({m.memberCount}人)</ListItem.Title>
                                    <ListItem.Subtitle>{m.roomId}</ListItem.Subtitle>
                                </ListItem.Content>
                                <ListItem.Chevron></ListItem.Chevron>
                            </ListItem>)
                    })}
            </ListItem.Accordion>

            <ListItem.Accordion content={
                <>
                    <ListItem.Content>
                        <ListItem.Title>联系人({members.length})</ListItem.Title>
                    </ListItem.Content>
                </>
            } onPress={() => setIsExpandContact(!isExpandContact)} isExpanded={isExpandContact}>
                {(searchVal !== '' ?
                    members.filter(m => m.user.userId.includes(searchVal) ||
                        m.user.displayName.includes(searchVal)) : members).map(m => {
                            return (
                                <ListItem topDivider bottomDivider key={m.user.userId} onPress={() => {
                                    navigation.push('Member', { userId: m.user.userId, roomId: m.roomId })
                                }}>
                                    <Avatar size={50} rounded title={m.user.displayName[0]} containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
                                    <ListItem.Content>
                                        <ListItem.Title style={{ fontSize: 22 }}>{m.user.displayName}</ListItem.Title>
                                        <ListItem.Subtitle>{m.user.userId} {m.roomId}</ListItem.Subtitle>
                                    </ListItem.Content>
                                    <ListItem.Chevron></ListItem.Chevron>
                                </ListItem>)
                        })}
            </ListItem.Accordion>

            <ListItem.Accordion content={
                <>
                    <ListItem.Content>
                        <ListItem.Title>群组({groups.length})</ListItem.Title>
                    </ListItem.Content>
                </>
            } onPress={() => setIsExpandGroup(!isExpandGroup)} isExpanded={isExpandGroup}>
                {(searchVal !== '' ?
                    groups.filter(m => m.name.includes(searchVal)) : groups).map(m => {
                        return (
                            <ListItem topDivider bottomDivider key={m.roomId} onPress={() => {
                                navigation.replace('Room', {
                                    id: m.roomId
                                })
                            }}>
                                <Avatar size={50} rounded title={'群'} containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
                                <ListItem.Content>
                                    <ListItem.Title style={{ fontSize: 22 }}>{m.name}({m.memberCount}人)</ListItem.Title>
                                    <ListItem.Subtitle>{m.roomId}</ListItem.Subtitle>
                                </ListItem.Content>
                                <ListItem.Chevron></ListItem.Chevron>
                            </ListItem>)
                    })}
            </ListItem.Accordion>
        </View>
    </View>
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { backgroundColor: '#ffffff', flex: 1 },
})