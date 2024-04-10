import { useTheme } from '@rneui/themed'
import { launchImageLibraryAsync, MediaTypeOptions } from 'expo-image-picker'
import { EventType } from 'matrix-js-sdk'
import React, { useEffect, useMemo, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import URI from 'urijs'
import BpayHeader from '../../../components/BpayHeader'
import { useGlobalState } from '../../../store/globalContext'
import { useMatrixClient } from '../../../store/useMatrixClient'
import { CardView } from '../components/CardView'
import ListItemPicker from '../components/ListItemPicker'
import { ISettingItem, SettingList } from '../components/SettingList'
import { IMemberItem, MemberList } from './components/MemberList'

export const RoomAdmin = ({ navigation, route }) => {
    const { setLoading } = useGlobalState()
    const { id } = route.params
    const { client } = useMatrixClient()
    const [room, setRoom] = useState(client.getRoom(id))
    const [admins, setAdmins] = useState<IMemberItem[]>([])
    const [owner, setOwner] = useState('')

    const { theme } = useTheme()
    const [profile, setProfile] = useState<{ roomId: string, avatar_url: string, name: string }>({
        roomId: '', avatar_url: undefined, name: ''
    })
    const [showPicker, setShowPicker] = useState(false)
    const [selectedValues, setSelectedValues] = useState([])

    useEffect(() => {
        const room = client.getRoom(id)
        if (room) {
            setRoom(room)
            setProfile({
                roomId: room.roomId,
                name: room.name,
                avatar_url: room.getAvatarUrl(client.baseUrl, 80, 80, 'crop', true)
            })

            setAdmins(
                room.getMembers().filter(i => i.powerLevel > 0).sort((a, b) => b.powerLevel - a.powerLevel).map(i => ({
                    name: i.name,
                    id: i.userId,
                    avatar: i.getAvatarUrl(client.baseUrl, 50, 50, 'scale', true, true)
                }))
            )
            setSelectedValues(room.getMembers().filter(i => i.powerLevel === 50).map(i => i.userId))
            setOwner(room.getMembers().find(i => i.powerLevel === 100).userId)
        }
        setRoom(client.getRoom(id))
    }, [id])

    // 设置群的头像
    const setRoomAvatar = async () => {
        let result = await launchImageLibraryAsync({
            mediaTypes: MediaTypeOptions.Images,
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
                await client.sendStateEvent(room.roomId, EventType.RoomAvatar, {
                    url: upload.content_uri,
                    info: {
                        h: a.height,
                        w: a.width,
                        mineType: a.mimeType,
                        size: a.fileSize
                    }
                })
                setProfile({
                    ...profile,
                    avatar_url: client.mxcUrlToHttp(upload.content_uri, 80, 80, 'scale', true, true)
                })
            })
        }
    }

    const setUserPowerLevel = async () => {
        setShowPicker(false)
        setLoading(true)
        try {
            const appended = selectedValues.filter(i => (!admins.map(a => a.id).includes(i)) && i !== owner)
            const removed = admins.map(i => i.id).filter(i => !selectedValues.includes(i) && i !== owner)
            console.log('appended, removed', appended, removed)
            await appended.length > 0 && client.setPowerLevel(id, appended, 50)
            await removed.length > 0 && client.setPowerLevel(id, removed, null)
            removed.forEach(i => {
                admins.splice(admins.findIndex(m => m.id === i), 1)
            })
            appended.forEach(i => {
                const member = room.getMember(i)
                admins.push({
                    name: member.name,
                    id: member.userId,
                    avatar: member.getAvatarUrl(client.baseUrl, 50, 50, 'scale', true, true)
                })
            })
            setAdmins([...admins])
            // setRefreshKey(randomUUID())
        } catch (e) {
            Alert.alert('错误', e.toString())
        } finally {
            setLoading(false)
        }
    }

    const settingItems: ISettingItem[] = useMemo(() => [
        {
            title: '设置群头像',
            onPress: setRoomAvatar,
        },
        {
            title: '转让群主'
        },
        {
            title: '解散群聊',
            breakTop: true,
            titleStyle: { color: theme.colors.error, alignItems: 'center' },
            titleContainerStyle: { alignItems: 'center' },
            hideChevron: true
        }
    ], [room])

    return <View style={styles.container}>
        <BpayHeader title='群管理' showback></BpayHeader>
        <CardView title={profile.name} subTittle={profile.roomId}
            avatarUrl={profile.avatar_url}></CardView>
        <SettingList items={[{ title: '群管理员', hideChevron: true }]}></SettingList>
        <MemberList containerStyle={{ paddingHorizontal: 10, paddingVertical: 20 }}
            items={admins} onSetting={() => { setShowPicker(true) }}></MemberList>
        <SettingList items={settingItems}></SettingList>
        <ListItemPicker items={room.getJoinedMembers().filter(i => i.userId !== owner).map(i => ({
            id: i.userId,
            title: i.name,
            subtitle: i.userId,
            avatar: i.getAvatarUrl(client.baseUrl, 50, 50, 'crop', true, true),
            right: i.membership
        }))} selectedValues={selectedValues}
            isVisible={showPicker}
            onCancel={() => setShowPicker(false)} onOk={setUserPowerLevel} allowRemove={true}></ListItemPicker>
    </View>
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { backgroundColor: '#ffffff', flex: 1 },
})