import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, TextInput, View } from 'react-native';
import URI from 'urijs';

import { Avatar, useTheme } from '@rneui/themed';

import { useGlobalState } from '../../store/globalContext';
import { useMatrixClient } from '../../store/useMatrixClient';
import { IPropEditorProps, PropEditor } from './components/PropEditor';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ISettingItem, SettingList } from './components/SettingList';
import { CardView } from './components/CardView';

export const MemberProfile = ({ navigation, route }) => {

    useEffect(() => {
        // set nav bar
        navigation.setOptions({
            title: ''
        })
    }, [])

    const { setLoading } = useGlobalState()
    const { theme } = useTheme()
    const { userId } = route.params
    const { client } = useMatrixClient()
    const isMe = userId === client.getUserId()

    const [profile, setProfile] = useState<{ userId: string, avatar_url: string, displayname: string, targetRoomId?: string, isFriend: boolean }>()
    const [reason, setReason] = useState<string>()
    const [editProps, setEditProps] = useState<IPropEditorProps>({ isVisible: false, props: {} })

    useEffect(() => {
        if (client.findDirectRoom(userId)) {
            const friend = client.findDirectRoom(userId).getMember(userId)
            setProfile({
                userId: friend.userId,
                avatar_url: friend.getAvatarUrl(client.baseUrl, 50, 50, 'scale', true, true),
                displayname: friend.name,
                targetRoomId: friend.roomId,
                isFriend: true
            })
        } else {
            client.getProfileInfo(userId).then(res => {
                setProfile({
                    userId: userId,
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
                        await client.deleteDirect(userId, client.findDirectRoom(userId).roomId)
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

    // 设置我的头像
    const setMyAvatar = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 4],
            quality: 1,
        });
        if (!result.canceled) {
            result.assets.forEach(async (a) => {
                const fileUri = new URI(a.uri)
                const response = await fetch(a.uri)
                const blob = await response.blob()
                const upload = await client.uploadContent(blob, {
                    name: fileUri.filename()
                })
                const avatar_url = client.mxcUrlToHttp(upload.content_uri, 80, 80, 'scale', true, true)
                await client.setAvatarUrl(avatar_url)
                setProfile({
                    ...profile,
                    avatar_url: avatar_url
                })
            })
        }
    }

    // 设置我的昵称
    const setMyNickName = () => {
        setEditProps({
            isVisible: true,
            title: '设置昵称',
            props: {
                name: {
                    value: profile?.displayname,
                    title: '昵称'
                },
            },
            onSave(data) {
                setLoading(true)
                client.setDisplayName(data.name.value).then(() => {
                    setProfile({
                        ...profile, displayname: data.name.value
                    })
                    setEditProps({ isVisible: false })
                }).finally(() => {
                    setLoading(false)
                })
            },
            onCancel() {
                setEditProps({ isVisible: false })
            },
        })
    }

    // 登出
    const logOut = () => {
        AsyncStorage.removeItem('TOKEN')
        AsyncStorage.removeItem('MATRIX_AUTH')
        client.stopClient()
        client.clearStores()
        navigation.push('Login')
    }

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: '#f5f5f5' },
        content: { backgroundColor: '#ffffff', marginBottom: 12, paddingHorizontal: 10 },
        listItem: { margin: 0, paddingVertical: 15 },
        listItemTitle: { fontSize: 20 },
        listItemText: { fontSize: 20, color: theme.colors.grey2 }
    })


    const friendSettingItems: ISettingItem[] = [
        {
            title: '设置备注',
            text: '备注',
        },
        {
            title: '消息免打扰',
            right: () => <Switch style={{ height: 20 }}></Switch>,
        },
        {
            title: '置顶聊天',
            right: () => <Switch style={{ height: 20 }}></Switch>,
        },
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

    const mySettingItems: ISettingItem[] = [
        {
            title: '设置昵称',
            onPress: setMyNickName,
            text: profile?.displayname
        },
        {
            title: '设置头像',
            onPress: setMyAvatar,
            right: () => <Avatar size={24} source={{ uri: profile?.avatar_url }}></Avatar>
        },
        {
            title: '我的收藏',
        },
        {
            title: '修改密码',
            breakTop: true,
            titleStyle: { color: theme.colors.primary, alignItems: 'center' },
            titleContainerStyle: { alignItems: 'center' },
            hideChevron: true
        },
        {
            title: '退出登录',
            onPress: logOut,
            breakTop: true,
            titleStyle: { color: theme.colors.error, alignItems: 'center' },
            titleContainerStyle: { alignItems: 'center' },
            hideChevron: true
        }
    ]

    const friendSetting = (<View style={styles.container}>
        <CardView title={profile?.displayname} subTittle={profile?.userId} avatarUrl={profile?.avatar_url} />
        <SettingList items={friendSettingItems}></SettingList>
    </View >)

    const foreignerSetting = (<View style={styles.container}>
        <CardView title={profile?.displayname} subTittle={profile?.userId} avatarUrl={profile?.avatar_url} />
        <View style={{ backgroundColor: '#fff', marginTop: -10, padding: 20 }}>
            <TextInput style={{ borderRadius: 10, backgroundColor: '#eee', height: 80, lineHeight: 20, padding: 8, textAlignVertical: 'top' }} multiline={true}
                numberOfLines={3} defaultValue={reason} onChangeText={setReason}></TextInput>
        </View>
        <SettingList items={foreignerSettingItems}></SettingList>
    </View >)

    const mySetting = (<View style={styles.container}>
        <CardView title={profile?.displayname} subTittle={profile?.userId} avatarUrl={profile?.avatar_url}
            onAvatarPress={setMyAvatar} />
        <SettingList items={mySettingItems}></SettingList>
    </View >)

    return <>
        <PropEditor editProps={editProps}></PropEditor>
        {isMe && mySetting}
        {!isMe && profile?.isFriend && friendSetting}
        {!isMe && !profile?.isFriend && foreignerSetting}
    </>
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { backgroundColor: '#ffffff' },
})