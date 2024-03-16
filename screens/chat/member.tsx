import { Avatar, useTheme, Text, Button, Input } from '@rneui/themed'
import { Preset, Visibility } from 'matrix-js-sdk'
import React, { useEffect, useState } from 'react'
import { Alert, TextInput, useWindowDimensions } from 'react-native'
import { View, StyleSheet } from 'react-native'
import { useMatrixClient } from '../../store/useMatrixClient'

export const MemberProfile = ({ navigation, route }) => {

    const { theme } = useTheme()
    const { userId, roomId } = route.params
    const { client } = useMatrixClient()
    const [profile, setProfile] = useState<{ userId: string, avatar_url: string, displayname: string }>()
    const { width, height } = useWindowDimensions()
    const [reason, setReason] = useState<string>()

    useEffect(() => {
        client.getProfileInfo(userId).then(res => {
            setProfile({
                userId: userId,
                avatar_url: res.avatar_url,
                displayname: res.displayname
            })
            setReason(`我是 ${client.getUser(client.getUserId()).displayName}`)
        })


    }, [])

    const startChat = () => {
        navigation.replace('Room', {
            id: roomId
        })
    }

    const inviteMember = () => {
        client.createRoom({
            is_direct: true,
            invite: [userId]
        }).then(({ room_id }) => {
            client.sendTextMessage(room_id, reason)
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
                    await client.leave(roomId)
                    await client.forget(roomId)
                    navigation.goBack()
                }
            },
        ]);
    }
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Avatar title={profile?.displayname[0]} size={width / 3} rounded
                    containerStyle={{
                        backgroundColor: theme.colors.primary,
                        marginBottom: 20,
                        marginTop: 40
                    }}></Avatar>
                <Text h4>ID: {profile?.userId}</Text>
                {roomId && (<><Button color='primary' containerStyle={{ width: '80%', marginTop: '20%' }} onPress={startChat}>发起聊天</Button>
                    <Button color='error' containerStyle={{ width: '80%', marginTop: '5%' }} onPress={deleteMember}>删除好友</Button></>)}
                {!roomId && <>
                    <TextInput
                        style={{
                            width: '80%', height: 100, backgroundColor: theme.colors.disabled,
                            marginTop: 20, marginBottom: 10, textAlignVertical: 'top', padding: 10,
                            borderRadius: 5, fontSize: 18
                        }}
                        value={reason}
                        onChangeText={setReason}
                        placeholder='输入申请说明'
                        multiline></TextInput>
                    <Button color='primary' containerStyle={{ width: '80%', marginTop: 10 }} onPress={inviteMember}>添加好友</Button>
                </>}
            </View>
        </View >
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { backgroundColor: '#ffffff', flex: 1, alignItems: 'center' },
})