import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import {
    Badge,
    Button,
    CheckBox,
    Icon, Switch, useTheme
} from '@rneui/themed';

import { useGlobalState } from '../../../store/globalContext';
import { useMatrixClient } from '../../../store/useMatrixClient';
import { IListItem } from '../components/ListView';
import { IMemberItem, MemberList } from './components/MemberList';
import { IPropEditorProps, PropEditor } from '../components/PropEditor';
import { Direction, EventType, Filter, JoinRule, RoomMember, RoomStateEvent, Visibility } from 'matrix-js-sdk';
import { ISettingItem, SettingList } from '../components/SettingList';
import ListItemPicker from '../components/ListItemPicker';
import { IRoomSetting } from '../groups';
import BpayHeader from '../../../components/BpayHeader';

export const RoomSetting = ({ navigation, route }) => {

    const { setLoading } = useGlobalState()
    const { id } = route.params
    const { client } = useMatrixClient()
    const [room, setRoom] = useState(client.getRoom(id))
    const [topic, setTopic] = useState('')
    const [me, setMe] = useState<RoomMember>()

    const [roomVisibility, setRoomVisibility] = useState(false)
    const [roomSetting, setRoomSetting] = useState<IRoomSetting>({
        name: '',
        visibilty: false,
        joinRule: JoinRule.Invite
    })
    const isDirectRoom = client.isDirectRoom(id)
    const { theme } = useTheme()
    const [roomMembers, setRoomMembers] = useState<IMemberItem[]>([])
    const [knockingMembers, setKnockingMembers] = useState<RoomMember[]>([])
    const [knockingPicker, setKnockingPicker] = useState(false)
    const [roomOnTop, setRoomOnTop] = useState(client.isRoomOnTop(id))

    const [editProps, setEditProps] = useState<IPropEditorProps>({ isVisible: false })

    useEffect(() => {
        setRoom(client.getRoom(id))
    }, [client.getRoom(id)])

    useEffect(() => {
        if (!room) {
            return
        }

        setMe(room.getMember(client.getUserId()))

        client.getRoomDirectoryVisibility(room.roomId).then(res => {
            setRoomVisibility(res.visibility === Visibility.Public)
        })

        async function refreshMembers() {
            setRoomMembers(room.getJoinedMembers()
                .sort((a, b) => b.powerLevel - a.powerLevel)
                .map(i => {
                    return {
                        id: i.userId,
                        name: i.name,
                        avatar: i.getAvatarUrl(client.baseUrl, 50, 50, 'crop', true, true)
                    };
                }));
            setKnockingMembers(room.getMembersWithMembership('knock'))

            const topicEvents = room.getLiveTimeline().getState(Direction.Forward).getStateEvents(EventType.RoomTopic)
            setTopic(topicEvents[0]?.getContent()?.topic || '')
            setRoomSetting({
                ...roomSetting,
                name: room.name,
                topic: topicEvents[0]?.getContent()?.topic || '',
                joinRule: room.getJoinRule()
            })
        }
        refreshMembers();

        room.on(RoomStateEvent.Members, refreshMembers)
        return () => {
            room.off(RoomStateEvent.Members, refreshMembers)
        }
    }, [room])

    // 退出群聊
    const leaveGroup = () => {
        Alert.alert("确认", "是否要退出群聊?", [
            {
                text: '取消',
                style: 'cancel',
            },
            {
                text: '确认', onPress: async () => {
                    setLoading(true)
                    try {
                        await client.leave(room.roomId)
                        await client.forget(room.roomId)
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

    // 点击成员头像
    const onMemberPress = (item: IListItem) => {
        navigation.push('Member', { userId: item.id, roomId: room.roomId })
    }

    // 邀请到新群
    const onCreateRoom = () => {
        const friend = roomMembers.filter(i => i.id !== client.getUserId())
        navigation.push('GroupChat', { initMembers: friend.map(i => i.id) })
    }

    // 邀请到本群
    const onInviteMember = () => {
        navigation.push('GroupChat', { initMembers: roomMembers.map(i => i.id), roomId: room.roomId })
    }

    // 删除成员
    const onRemoveMember = () => {
        navigation.push('GroupChat', { initMembers: roomMembers.map(i => i.id), roomId: room.roomId, removable: true })
    }

    // 设置置顶
    const onTopChange = (value) => {
        setRoomOnTop(value)
        client.setRoomOnTop(room.roomId, value)
    }

    // 设置为公共聊天
    const onRoomPublic = async (value) => {
        try {
            setLoading(true)
            setRoomVisibility(value)
            await client.sendStateEvent(room.roomId, EventType.RoomJoinRules, { join_rule: value ? JoinRule.Public : JoinRule.Invite })
            await client.setRoomDirectoryVisibility(room.roomId, value ? Visibility.Public : Visibility.Private)
            await client.sendStateEvent(room.roomId, EventType.RoomHistoryVisibility, {
                history_visibility: value ? 'world_readable' : 'joined'
            })
        }
        catch (e) {
            Alert.alert('错误', e.toString())
            console.error('onRoomPublic', e)
        }
        finally {
            setLoading(false)
        }
    }

    // 设置邀请规则
    const setJoinRole = async (rule: JoinRule) => {
        client.sendStateEvent(room.roomId, EventType.RoomJoinRules, {
            join_rule: rule
        })
    }

    // 设置群聊名称
    const setRoomName = () => {
        if (!client.canDo(room.roomId, 'm.room.name')) {
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

    // 设置群公告
    const setRoomTopic = () => {
        if (!client.canDo(room.roomId, 'm.room.topic')) {
            Alert.alert('提示', "您无权限修改群公告")
            return
        }
        setEditProps({
            isVisible: true,
            title: '设置群公告',
            props: {
                name: {
                    title: '公告内容',
                    value: topic
                }
            },
            onSave(props) {
                setLoading(true)
                client.setRoomTopic(room.roomId, props.name.value)
                    .then(() => {
                        setEditProps({ isVisible: false })
                        setTopic(props.name.value)
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
            title: '聊天文件',
            onPress: () => { navigation.push('Documents', { id: room.roomId, title: '聊天文件' }) }
        },
        {
            title: '消息免打扰',
            right: () => <Switch style={{ height: 20 }}></Switch>,
            hideChevron: true,
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
            onPress: () => navigation.push('Qrcode', { uri: id }),
            hidden: !roomVisibility
        },
        {
            title: '群公告',
            text: topic,
            onPress: setRoomTopic,
            hidden: me?.powerLevel === 0
        },
        {
            title: '公共群组',
            right: () => <Switch value={roomVisibility} onValueChange={onRoomPublic} style={{ height: 20 }}></Switch>,
            hidden: me?.powerLevel !== 100
        },
        {
            title: '邀请方式',
            right: () => <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {roomVisibility ? <><CheckBox
                    checked={roomSetting.joinRule === JoinRule.Public}
                    onPress={() => {
                        setRoomSetting({ ...roomSetting, joinRule: JoinRule.Public })
                        setJoinRole(JoinRule.Public)
                    }}
                    title='公开'
                    size={25}
                    containerStyle={{ padding: 0, marginLeft: 0, marginRight: 0 }}
                    textStyle={{ marginLeft: 0, marginRight: 5 }}
                    checkedIcon="dot-circle-o"
                    uncheckedIcon="circle-o"
                />
                    <CheckBox
                        checked={roomSetting.joinRule === JoinRule.Knock}
                        onPress={() => {
                            setRoomSetting({ ...roomSetting, joinRule: JoinRule.Knock })
                            setJoinRole(JoinRule.Knock)
                        }}
                        title='申请'
                        containerStyle={{ padding: 0, marginLeft: 0, marginRight: 0 }}
                        textStyle={{ marginLeft: 0, marginRight: 5 }}
                        size={25}
                        checkedIcon="dot-circle-o"
                        uncheckedIcon="circle-o"
                    /></>
                    :
                    <CheckBox
                        checked={roomSetting.joinRule === JoinRule.Invite}
                        title='邀请'
                        size={25}
                        containerStyle={{ padding: 0, marginLeft: 0, marginRight: 0 }}
                        textStyle={{ marginLeft: 0, marginRight: 5 }}
                        checkedIcon="dot-circle-o"
                        uncheckedIcon="circle-o"
                    />}
            </View>,
            hidden: me?.powerLevel !== 100
        },
        {
            title: '群管理',
            onPress: () => {
                if (!client.canDo(id, 'm.room.power_levels')) {
                    Alert.alert('提示', '您无群管理权限')
                    return
                }
                navigation.push('RoomAdmin', { id: room.roomId })
            },
            hidden: me?.powerLevel !== 100
        },
        {
            title: '群申请审批',
            right: () => <Badge badgeStyle={knockingMembers.length > 0 && { backgroundColor: theme.colors.error }} value={knockingMembers.length}></Badge>,
            hidden: me?.powerLevel === 0 || roomSetting.joinRule !== JoinRule.Knock,
            onPress: () => setKnockingPicker(true),
        },
        {
            title: '查找聊天记录',
            breakTop: true
        },
        {
            title: '群文件',
            onPress: () => { navigation.push('Documents', { id: room.roomId }) }
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

    const accpetKnocking = (userId) => {
        client.invite(room.roomId, userId)
    }

    const rejectKnocking = (userId) => {
        client.kick(room.roomId, userId)
    }

    const roomSettingJsx = room && <View style={styles.container}>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <MemberList containerStyle={{ paddingVertical: 20 }} items={roomMembers}
                onAppend={onInviteMember}
                onDelete={client.canDo(id, 'kick') ? onRemoveMember : null}
                onItemPress={onMemberPress}></MemberList>
        </View>
        <SettingList items={groupSettingItems}></SettingList>
        <ListItemPicker title='群申请审批' items={knockingMembers.map(i => ({
            id: i.userId,
            title: i.name,
            subtitle: i.events.member.getContent().reason,
            avatar: i.getAvatarUrl(client.baseUrl, 50, 50, 'crop', true, true),
            right: <>
                <Button titleStyle={{ color: theme.colors.error }} type='clear' title={'拒绝'}
                    onPress={() => rejectKnocking(i.userId)}></Button>
                <Button type='clear' title={'同意'}
                    onPress={() => accpetKnocking(i.userId)}></Button>
            </>

        }))} enableSelect={false}
            isVisible={knockingPicker}
            onCancel={() => setKnockingPicker(false)}></ListItemPicker>
    </View >

    const friendSettingJsx = room && <View style={styles.container}>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <MemberList containerStyle={{ paddingVertical: 20 }} onItemPress={onMemberPress}
                onAppend={onCreateRoom}
                items={roomMembers.filter(i => i.id !== client.getUserId())}></MemberList>
        </View>
        <SettingList items={friendSettingItems}></SettingList>
    </View>

    return <>
        <BpayHeader title='聊天设置' showback></BpayHeader>
        <PropEditor editProps={editProps}></PropEditor>
        <ScrollView>
            {isDirectRoom ? friendSettingJsx : roomSettingJsx}
        </ScrollView>
    </>
}