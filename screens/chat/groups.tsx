import { EventType, JoinRule, Preset, Visibility } from 'matrix-js-sdk';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { ListItem } from '@rneui/base';
import { Avatar, BottomSheet, Button, CheckBox, Input, SearchBar, Switch, Text, useTheme } from '@rneui/themed';

import { useGlobalState } from '../../store/globalContext';
import { useMatrixClient } from '../../store/useMatrixClient';
import { IListItem, ListView } from './components/ListView';
import { ISettingItem, SettingList } from './components/SettingList';
import { IPropEditorProps, PropEditor } from './components/PropEditor';
import BpayHeader from '../../components/BpayHeader';

export interface IRoomSetting {
    name: string,
    topic: string,
    joinRule: JoinRule,
    visibilty: boolean
}

export const GroupChat = ({ navigation, route }) => {

    const { setLoading } = useGlobalState()
    const { theme } = useTheme()
    const { client } = useMatrixClient()
    const roomId = route.params?.roomId
    const room = client.getRoom(roomId)
    const isDirectRoom = client.isDirectRoom(roomId)

    const [searchVal, setSearchVal] = useState('')
    const initMembers: string[] = route.params?.initMembers ? [...route.params.initMembers] : []
    const removable = route.params?.removable || false
    const [members, setMembers] = useState<IListItem[]>([])
    const [selectedValue] = useState<string[]>(initMembers)
    const [isRoomOptionVisible, setIsRoomOptionVisible] = useState(false)
    const [roomSetting, setRoomSetting] = useState<IRoomSetting>({
        name: '',
        topic: '',
        joinRule: JoinRule.Invite,
        visibilty: false
    })
    const [editProps, setEditProps] = useState<IPropEditorProps>({ isVisible: false })

    useEffect(() => {
        if (!removable) {
            const rooms = client.getRooms().filter(i => client.isDirectRoom(i.roomId))
            setMembers(rooms.map(i => {
                const member = i.getMember(i.guessDMUserId())
                return {
                    id: member.userId,
                    title: member.name,
                    subtitle: member.userId,
                    avatar: member.getAvatarUrl(client.baseUrl, 40, 40, 'scale', true, true),
                    right: member.membership
                }
            }))
        } else {
            const members = room.getJoinedMembers().filter(i => i.userId !== client.getUserId())
            setMembers(members.map(i => ({
                id: i.userId,
                title: i.name,
                subtitle: i.userId,
                avatar: i.getAvatarUrl(client.baseUrl, 50, 50, 'crop', true, true),
                right: i.membership
            })))
        }
    }, [])

    const searchUser = (search) => {
        setSearchVal(search)
    }

    // 邀请或踢人
    const onSetMember = async () => {
        try {
            setLoading(true)
            const inviteMembers = selectedValue.filter(i => !initMembers.includes(i) && i !== client.getUserId())
            const removeMembers = removable ? initMembers.filter(i => !selectedValue.includes(i) && i !== client.getUserId()) : []
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
        setIsRoomOptionVisible(true)
    }

    const createGroup = () => {
        if (roomSetting.name === '') {
            Alert.alert('提示', '群名称不能为空')
            return
        }
        setLoading(true)
        client.createRoom({
            is_direct: false,
            visibility: roomSetting.visibilty ? Visibility.Public : Visibility.Private,
            invite: selectedValue,
            name: roomSetting.name,
            topic: roomSetting.topic,
            initial_state: [
                {
                    type: EventType.RoomJoinRules,
                    content: {
                        join_rule: roomSetting.joinRule
                    }
                },
                {
                    type: EventType.RoomHistoryVisibility,
                    content: {
                        history_visibility: roomSetting.visibilty ? 'world_readable' : 'joined'
                    }
                }
            ]

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

    // 设置群聊名称
    const setGroupName = () => {
        setEditProps({
            isVisible: true,
            title: '设置群聊名称',
            props: {
                name: {
                    title: '名称',
                    value: roomSetting.name
                }
            },
            onSave(props) {
                setRoomSetting({ ...roomSetting, name: props.name.value })
                setEditProps({ isVisible: false })
            },
            onCancel() {
                setEditProps({ isVisible: false })
            },
        })
    }

    // 设置群聊名称
    const setGroupTopic = () => {
        setEditProps({
            isVisible: true,
            title: '设置群聊话题',
            props: {
                name: {
                    title: '话题',
                    value: roomSetting.topic
                }
            },
            onSave(props) {
                setRoomSetting({ ...roomSetting, topic: props.name.value })
                setEditProps({ isVisible: false })
            },
            onCancel() {
                setEditProps({ isVisible: false })
            },
        })
    }


    const groupSettingItems: ISettingItem[] = [
        {
            title: '群组设置',
            titleStyle: { fontWeight: 'bold' },
            hideChevron: true
        },
        {
            title: '群名称',
            text: roomSetting.name,
            onPress: setGroupName
        },
        {
            title: '群话题',
            text: roomSetting.topic,
            onPress: setGroupTopic
        },
        {
            title: '公共群组',
            right: () => <Switch value={roomSetting.visibilty} onValueChange={() => {
                setRoomSetting({ ...roomSetting, visibilty: !roomSetting.visibilty, joinRule: roomSetting.visibilty ? JoinRule.Invite : JoinRule.Public })
            }} style={{ height: 20 }}></Switch>,
        },
        {
            title: '邀请方式',
            right: () => <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {roomSetting.visibilty ? <><CheckBox
                    checked={roomSetting.joinRule === JoinRule.Public}
                    onPress={() => { setRoomSetting({ ...roomSetting, joinRule: JoinRule.Public }) }}
                    title='公开'
                    size={25}
                    containerStyle={{ padding: 0, marginLeft: 0, marginRight: 0 }}
                    textStyle={{ marginLeft: 0, marginRight: 5 }}
                    checkedIcon="dot-circle-o"
                    uncheckedIcon="circle-o"
                />
                    <CheckBox
                        checked={roomSetting.joinRule === 'knock'}
                        onPress={() => { setRoomSetting({ ...roomSetting, joinRule: JoinRule.Knock }) }}
                        title='申请'
                        containerStyle={{ padding: 0, marginLeft: 0, marginRight: 0 }}
                        textStyle={{ marginLeft: 0, marginRight: 5 }}
                        size={25}
                        checkedIcon="dot-circle-o"
                        uncheckedIcon="circle-o"
                    /></>
                    :
                    <CheckBox
                        checked={roomSetting.joinRule === 'invite'}
                        onPress={() => { setRoomSetting({ ...roomSetting, joinRule: JoinRule.Invite }) }}
                        title='邀请'
                        size={25}
                        containerStyle={{ padding: 0, marginLeft: 0, marginRight: 0 }}
                        textStyle={{ marginLeft: 0, marginRight: 5 }}
                        checkedIcon="dot-circle-o"
                        uncheckedIcon="circle-o"
                    />}
            </View>
        },
    ]

    return <View style={styles.container}>
        <BpayHeader title='群组成员' showback></BpayHeader>
        <PropEditor editProps={editProps}></PropEditor>
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
                <ListView allowRemove={removable} items={members} search={searchVal} selectedValues={selectedValue} enableSelect multiSelect></ListView>
            </ScrollView>
        </View>
        <Button title={'确定'} onPress={(roomId === undefined || isDirectRoom) ? onCreateGroup : () => {
            Alert.alert('提示', '请确认群成员操作', [
                {
                    text: '取消'
                },
                {
                    text: '确定',
                    onPress(value?) {
                        onSetMember()
                    },
                }
            ])
        }}
            titleStyle={{ fontSize: 18 }} containerStyle={{ backgroundColor: '#ffffff', paddingHorizontal: 10, paddingBottom: 30 }}></Button>
        <BottomSheet modalProps={{}} isVisible={isRoomOptionVisible}>
            <SettingList items={groupSettingItems} ></SettingList>
            <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', backgroundColor: theme.colors.background }}>
                <Button type='outline' buttonStyle={{ borderColor: theme.colors.error }}
                    containerStyle={styles.buttonContainer}
                    titleStyle={{ color: theme.colors.error }}
                    onPress={() => setIsRoomOptionVisible(false)}>取消</Button>
                <Button containerStyle={styles.buttonContainer} onPress={createGroup}>确定</Button>
            </View>
        </BottomSheet>
    </View>
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { backgroundColor: '#ffffff', flex: 1 },
    buttonContainer: {
        paddingVertical: 10,
        width: '44%',
        backgroundColor: '#ffffff'
    }
})