import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, TextInput, View } from 'react-native';

import { useTheme } from '@rneui/themed';

import BpayHeader from '../../components/BpayHeader';
import { useGlobalState } from '../../store/globalContext';
import { useMatrixClient } from '../../store/useMatrixClient';
import { normalizeUserId } from '../../utils';
import { CardView } from '../../components/CardView';
import { ISettingItem, SettingList } from '../../components/SettingList';
import { ConditionKind, PushRuleKind } from 'matrix-js-sdk';

export const MemberProfile = ({ navigation, route }) => {

    const { setLoading } = useGlobalState()
    const { theme } = useTheme()
    const { userId } = route.params
    const { client } = useMatrixClient()

    const [profile, setProfile] = useState<{ userId: string, avatar_url: string, displayname: string, targetRoomId?: string, isFriend: boolean }>()
    const [reason, setReason] = useState<string>()
    const [roomOnTop, setRoomOnTop] = useState(false)

    useEffect(() => {
        const directRoom = client.findDirectRoom(userId)
        if (directRoom && directRoom.getMyMembership() !== 'leave') {
            const friend = directRoom.getMember(userId)
            setProfile({
                userId: normalizeUserId(friend.userId),
                avatar_url: friend.getAvatarUrl(client.baseUrl, 50, 50, 'scale', true, true),
                displayname: friend.name,
                targetRoomId: friend.roomId,
                isFriend: true
            })
            setRoomOnTop(client.isRoomOnTop(friend.roomId))
        } else {
            client.getProfileInfo(userId).then(res => {
                setProfile({
                    userId: normalizeUserId(userId),
                    avatar_url: res.avatar_url,
                    displayname: res.displayname,
                    isFriend: false
                })
                setReason(`我是 ${client.getUser(client.getUserId()).displayName}`)
            })
        }
    }, [userId])

    // 进入聊天室
    const startChat = () => {
        navigation.replace('Room', {
            id: profile.targetRoomId
        })
    }

    // 邀请好友
    const inviteMember = async () => {
        setLoading(true)
        try {
            await client.inviteDriect(userId, reason)
            navigation.goBack()
        } catch (e) {
            Alert.alert('错误', e.toString())
        } finally {
            setLoading(false)
        }
    }

    // 删除好友
    const deleteMember = () => {
        Alert.alert('请确认操作', '将删除好友和聊天记录', [
            {
                text: '取消',
                onPress: () => console.log('Cancel Pressed'),
                style: 'cancel',
            },
            {
                text: '确认', onPress: async () => {
                    setLoading(true)
                    try {
                        await client.deleteDirect(userId)
                        navigation.popToTop()
                    } catch (e) {
                        console.log(e)
                    } finally {
                        setLoading(false)
                    }

                }
            },
        ]);
    }

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: '#f5f5f5' },
        content: { backgroundColor: '#ffffff', marginBottom: 12, paddingHorizontal: 10 },
        listItem: { margin: 0, paddingVertical: 15 },
        listItemTitle: { fontSize: 20 },
        listItemText: { fontSize: 20, color: theme.colors.grey2 }
    })

    // 设置置顶
    // const onTopChange = (value) => {
    //     setRoomOnTop(value)
    //     client.setRoomOnTop(profile.targetRoomId, value)
    // }


    const friendSettingItems: ISettingItem[] = [
        {
            title: '设置备注',
            text: '备注',
        },
        // {
        //     title: '置顶聊天',
        //     right: () => <Switch value={roomOnTop} onValueChange={onTopChange} style={{ height: 20 }}></Switch>,
        // },
        {
            title: '发消息',
            onPress: startChat,
            breakTop: true,
            titleStyle: { color: theme.colors.primary, alignItems: 'center' },
            titleContainerStyle: { alignItems: 'center' },
            hideChevron: true
        },
        {
            title: '删除好友',
            onPress: deleteMember,
            breakTop: true,
            titleStyle: { color: theme.colors.error, alignItems: 'center' },
            titleContainerStyle: { alignItems: 'center' },
            hideChevron: true
        }
    ]

    const foreignerSettingItems: ISettingItem[] = [
        {
            title: '申请加为好友',
            onPress: inviteMember,
            breakTop: true,
            titleStyle: { color: theme.colors.primary, alignItems: 'center' },
            titleContainerStyle: { alignItems: 'center' },
            hideChevron: true
        },
    ]

    const friendSetting = (<View style={styles.container}>
        <CardView title={profile?.displayname} subTittle={profile?.userId} avatar={profile?.avatar_url} />
        <SettingList items={friendSettingItems}></SettingList>
    </View >)

    const foreignerSetting = (<View style={styles.container}>
        <CardView title={profile?.displayname} subTittle={profile?.userId} avatar={profile?.avatar_url} />
        <View style={{ backgroundColor: '#fff', marginTop: -10, padding: 20 }}>
            <TextInput style={{ borderRadius: 10, backgroundColor: '#eee', height: 80, lineHeight: 20, padding: 8, textAlignVertical: 'top' }} multiline={true}
                numberOfLines={3} defaultValue={reason} onChangeText={setReason}></TextInput>
        </View>
        <SettingList items={foreignerSettingItems}></SettingList>
    </View >)

    return <>
        <BpayHeader showback title='用户信息'></BpayHeader>
        {profile?.isFriend ? friendSetting : foreignerSetting}
    </>
}