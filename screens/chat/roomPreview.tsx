import { View, Text, TextInput } from 'react-native'
import React, { useEffect, useState } from 'react'
import BpayHeader from '../../components/BpayHeader'
import { CardView } from './components/CardView'
import { useMatrixClient } from '../../store/useMatrixClient'
import { useGlobalState, useProfile } from '../../store/globalContext'
import { ISettingItem, SettingList } from './components/SettingList'
import { useTheme } from '@rneui/themed'
import Toast from 'react-native-root-toast'
import { JoinRule } from 'matrix-js-sdk'

export default function RoomPreview({ navigation, route }) {

    const { id } = route.params
    const { setLoading } = useGlobalState()
    const { profile } = useProfile()
    const { theme } = useTheme()
    const [roomName, setRoomName] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [reason, setReason] = useState('我是' + profile.name)
    const [joinrule, setJoinrule] = useState(JoinRule.Knock)
    const { client } = useMatrixClient()

    useEffect(() => {
        client.peekInRoom(id).then(room => {
            setRoomName(room.name)
            setAvatarUrl(room.getAvatarUrl(client.baseUrl, 50, 50, 'scale'))
            setJoinrule(room.getJoinRule())
        })

        return () => {
            client.stopPeeking()
        }
    }, [id])

    const joinRoom = async () => {
        setLoading(true)
        try {
            await client.joinRoom(id)
            navigation.replace('Room', { id: id })
        } catch (e) {
            Toast.show(e.toString(), {
                duration: Toast.durations.LONG,
                position: Toast.positions.CENTER
            })
        } finally {
            setLoading(false)
        }
    }

    const knockRoom = async () => {
        setLoading(true)
        try {
            await client.knockRoom(id as string, { reason: reason })
            Toast.show('已发送申请', {
                duration: Toast.durations.LONG,
                position: Toast.positions.CENTER
            });
        } catch (e) {
            Toast.show(e.toString(), {
                duration: Toast.durations.LONG,
                position: Toast.positions.CENTER
            })
        } finally {
            setLoading(false)
        }
    }

    const foreignerSettingItems: ISettingItem[] = [
        {
            title: joinrule === JoinRule.Knock ? '入群申请' : '加入群聊',
            onPress: joinrule === JoinRule.Knock ? knockRoom : joinRoom,
            breakTop: true,
            titleStyle: { color: theme.colors.primary, alignItems: 'center' },
            titleContainerStyle: { alignItems: 'center' },
            hideChevron: true
        },
    ]

    return (
        <View>
            <BpayHeader showback title={''}></BpayHeader>
            <CardView title={roomName} subTittle={id} avatarUrl={avatarUrl}></CardView>
            <View style={{ backgroundColor: '#fff', marginTop: -10, padding: 20 }}>
                <TextInput style={{ borderRadius: 10, backgroundColor: '#eee', height: 80, lineHeight: 20, padding: 8, textAlignVertical: 'top' }} multiline={true}
                    numberOfLines={3} defaultValue={reason} onChangeText={setReason}></TextInput>
            </View>
            <SettingList items={foreignerSettingItems}></SettingList>
        </View>
    )
}