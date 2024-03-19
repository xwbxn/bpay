import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, View } from 'react-native';
import URI from 'urijs';

import { Avatar, Divider, Icon, ListItem, Text, useTheme } from '@rneui/themed';

import { useGlobalState } from '../../store/globalContext';
import { useMatrixClient } from '../../store/useMatrixClient';
import { IPropEditorProps, PropEditor } from './components/PropEditor';

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
        if (client.isFriend(userId)) {
            const friend = client.getFriend(userId)
            setProfile({
                userId: friend.userId,
                avatar_url: friend.avatar_url,
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

    const startChat = () => {
        navigation.replace('Room', {
            id: profile.targetRoomId
        })
    }

    const inviteMember = async () => {
        setLoading(true)
        try {
            await client.inviteFriend(userId, reason)
            navigation.replace('Sessions')
        } catch (e) {
            Alert.alert('错误', e.toString())
        } finally {
            setLoading(false)
        }
    }

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
                        await client.deleteFriend(userId)
                        navigation.goBack()
                    } finally {
                        setLoading(false)
                    }

                }
            },
        ]);
    }

    const onSetAvatar = async () => {
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

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: '#f5f5f5' },
        content: { backgroundColor: '#ffffff', marginBottom: 12, paddingHorizontal: 10 },
        listItem: { margin: 0, paddingVertical: 15 },
        listItemTitle: { fontSize: 20 },
        listItemText: { fontSize: 20, color: theme.colors.grey2 }
    })

    const friendSetting = (<View style={styles.container}>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <ListItem>
                {profile?.avatar_url
                    ? <Avatar size={80} rounded source={{ uri: profile?.avatar_url }} onPress={() => { isMe && onSetAvatar() }}
                        containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
                    : <Avatar size={80} rounded title={profile?.displayname[0]} onPress={() => { isMe && onSetAvatar() }}
                        containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>}
                <ListItem.Content style={{ marginLeft: 10 }}>
                    <ListItem.Title style={{ fontSize: 30 }}>{profile?.displayname}</ListItem.Title>
                    <ListItem.Subtitle style={{ fontSize: 15 }}>{profile?.userId}</ListItem.Subtitle>
                </ListItem.Content>
            </ListItem>
        </View>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>设置备注</ListItem.Title>
                </ListItem.Content>
                <Text style={styles.listItemText}>{'备注'}</Text>
                <ListItem.Chevron></ListItem.Chevron>
            </ListItem>
            <Divider></Divider>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>消息免打扰</ListItem.Title>
                </ListItem.Content>
                <Switch style={{ height: 20 }}></Switch>
            </ListItem>
            <Divider></Divider>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>置顶聊天</ListItem.Title>
                </ListItem.Content>
                <Switch style={{ height: 20 }}></Switch>
            </ListItem>
        </View>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <ListItem containerStyle={styles.listItem} onPress={startChat}>
                <ListItem.Content style={{ alignItems: 'center', flexDirection: 'row' }}>
                    <Icon size={28} color={theme.colors.primary} name='chatbox-ellipses-outline' type='ionicon'></Icon>
                    <ListItem.Title style={{ ...styles.listItemTitle, color: theme.colors.primary, marginLeft: 5 }}>
                        发消息</ListItem.Title>
                </ListItem.Content>
            </ListItem>
        </View>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <ListItem containerStyle={styles.listItem} onPress={deleteMember}>
                <ListItem.Content style={{ alignItems: 'center' }}>
                    <ListItem.Title style={{ ...styles.listItemTitle, color: theme.colors.error }}>
                        删除好友</ListItem.Title>
                </ListItem.Content>
            </ListItem>
        </View>
    </View >)

    const foreignerSetting = (<View style={styles.container}>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <ListItem>
                {profile?.avatar_url
                    ? <Avatar size={80} rounded source={{ uri: profile?.avatar_url }}
                        containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
                    : <Avatar size={80} rounded title={profile?.displayname[0]}
                        containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>}
                <ListItem.Content style={{ marginLeft: 10 }}>
                    <ListItem.Title style={{ fontSize: 30 }}>{profile?.displayname}</ListItem.Title>
                    <ListItem.Subtitle style={{ fontSize: 15 }}>{profile?.userId}</ListItem.Subtitle>
                </ListItem.Content>
            </ListItem>
        </View>

        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <ListItem containerStyle={styles.listItem} onPress={inviteMember}>
                <ListItem.Content style={{ alignItems: 'center' }}>
                    <ListItem.Title style={{ ...styles.listItemTitle, color: theme.colors.primary }}>
                        申请添加为好友</ListItem.Title>
                </ListItem.Content>
            </ListItem>
        </View>
    </View >)

    const mySetting = (<View style={styles.container}>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <ListItem>
                {profile?.avatar_url
                    ? <Avatar size={80} rounded source={{ uri: profile?.avatar_url }} onPress={() => { isMe && onSetAvatar() }}
                        containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
                    : <Avatar size={80} rounded title={profile?.displayname[0]} onPress={() => { isMe && onSetAvatar() }}
                        containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>}
                <ListItem.Content style={{ marginLeft: 10 }}>
                    <ListItem.Title style={{ fontSize: 30 }}>{profile?.displayname}</ListItem.Title>
                    <ListItem.Subtitle style={{ fontSize: 15 }}>{profile?.userId}</ListItem.Subtitle>
                </ListItem.Content>
            </ListItem>
        </View>

        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <ListItem containerStyle={styles.listItem} onPress={setMyNickName}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>设置昵称</ListItem.Title>
                </ListItem.Content>
                <Text style={styles.listItemText}>{profile?.displayname}</Text>
                <ListItem.Chevron></ListItem.Chevron>
            </ListItem>
            <Divider></Divider>
            <ListItem containerStyle={styles.listItem} onPress={onSetAvatar}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>设置头像</ListItem.Title>
                </ListItem.Content>
                <Avatar size={24} source={{ uri: profile?.avatar_url }}></Avatar>
                <ListItem.Chevron></ListItem.Chevron>
            </ListItem>
            <Divider></Divider>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>我的收藏</ListItem.Title>
                </ListItem.Content>
                <ListItem.Chevron onPress={onSetAvatar}></ListItem.Chevron>
            </ListItem>
        </View>

        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <ListItem containerStyle={styles.listItem} >
                <ListItem.Content style={{ alignItems: 'center' }}>
                    <ListItem.Title style={{ ...styles.listItemTitle, color: theme.colors.primary }}>
                        修改密码</ListItem.Title>
                </ListItem.Content>
            </ListItem>
        </View>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <ListItem containerStyle={styles.listItem} >
                <ListItem.Content style={{ alignItems: 'center' }}>
                    <ListItem.Title style={{ ...styles.listItemTitle, color: theme.colors.error }}>
                        退出登录</ListItem.Title>
                </ListItem.Content>
            </ListItem>
        </View>
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