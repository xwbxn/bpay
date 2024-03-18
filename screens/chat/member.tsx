import { Avatar, useTheme, Text, Button, Input, ListItem, Divider, Icon } from '@rneui/themed'
import React, { useEffect, useState } from 'react'
import { Alert, Switch, TextInput, useWindowDimensions } from 'react-native'
import { View, StyleSheet } from 'react-native'
import { useMatrixClient } from '../../store/useMatrixClient'

export const MemberProfile = ({ navigation, route }) => {

    useEffect(() => {
        // set nav bar
        navigation.setOptions({
            title: ''
        })
    }, [])

    const { theme } = useTheme()
    const { userId, roomId } = route.params
    const { client } = useMatrixClient()

    const [profile, setProfile] = useState<{ userId: string, avatar_url: string, displayname: string, targetRoomId?: string, isFriend: boolean }>()
    const { width, height } = useWindowDimensions()
    const [reason, setReason] = useState<string>()

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

    const inviteMember = () => {
        client.inviteFriend(userId, reason).then(() => {
            navigation.replace('Sessions')
        })
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
                    await client.deleteFriend(userId)
                    navigation.goBack()
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

    return (
        <View style={styles.container}>
            <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
                <ListItem>
                    <Avatar size={80} rounded title={'谢'}
                        containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
                    <ListItem.Content style={{ marginLeft: 10 }}>
                        <ListItem.Title style={{ fontSize: 30 }}>{'谢文博'}</ListItem.Title>
                        <ListItem.Subtitle style={{ fontSize: 15 }}>{'123123123'}</ListItem.Subtitle>
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
                <ListItem containerStyle={styles.listItem}>
                    <ListItem.Content style={{ alignItems: 'center', flexDirection: 'row' }}>
                        <Icon size={28} color={theme.colors.primary} name='chatbox-ellipses-outline' type='ionicon'></Icon>
                        <ListItem.Title style={{ ...styles.listItemTitle, color: theme.colors.primary, marginLeft: 5 }}>
                            发消息</ListItem.Title>
                    </ListItem.Content>
                </ListItem>
            </View>
            <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
                <ListItem containerStyle={styles.listItem}>
                    <ListItem.Content style={{ alignItems: 'center' }}>
                        <ListItem.Title style={{ ...styles.listItemTitle, color: theme.colors.error }}>删除好友</ListItem.Title>
                    </ListItem.Content>
                </ListItem>
            </View>

        </View >
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { backgroundColor: '#ffffff' },
})