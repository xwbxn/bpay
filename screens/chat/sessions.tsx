import React, { useEffect, useState } from 'react'
import { FlatList, TouchableOpacity, View, StyleSheet, Alert } from 'react-native'
import { Avatar, Badge, Divider, Icon, Image, Text, useTheme } from '@rneui/themed'
import { SafeAreaView } from 'react-native-safe-area-context'
import moment from 'moment'
import 'moment/locale/zh-cn'
import { useChatClient } from '../../store/chat'
import { ClientEvent, MatrixEvent, MatrixEventEvent, NotificationCountType, RoomEvent } from 'matrix-js-sdk'


const Session = ({ route, navigation }) => {

    const { theme } = useTheme()
    const [data, setData] = useState([])
    const [client, rooms] = useChatClient((state) => [state.chatClient, state.rooms])

    useEffect(() => {
        setData(rooms.map(v => {
            return {
                id: v.roomId,
                name: v.name,
                avatar: v.getAvatarUrl(client.baseUrl, 50, 50, 'crop'),
                label: v.getLastLiveEvent().getContent().displayname,
                unread: v.getUnreadNotificationCount(),
                updatedAt: v.getLastActiveTimestamp()
            }
        }))
    }, [rooms])

    const onPress = (item) => {
        // navigation.push('Chat')
        client.sendTextMessage("!lwZVGSNaKBwDEUonAd:chat.b-pay.life", "this is a test")
    }

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => onPress(item)}>
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8 }}>
                <View>
                    <Avatar size={50} rounded title={item.name[0]} containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
                    {item.unread !== 0 && <Badge value={item.unread} status="error" containerStyle={{ position: 'absolute', top: -5, left: 35 }}></Badge>}
                </View>
                <View style={{ flex: 1, justifyContent: 'space-between', padding: 8 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.name}</Text>
                    <Text style={{ fontSize: 14, color: theme.colors.grey3 }}>{item.label}</Text>
                </View>
                <View style={{ paddingTop: 10 }}>
                    <Text style={{ fontSize: 12, color: theme.colors.grey3 }}>{moment(item.updateAt).fromNow()}</Text>
                </View>
            </View>
            <Divider style={{ width: "100%" }}></Divider>
        </TouchableOpacity>
    );

    return <SafeAreaView style={styles.container}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 50 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>聊天(5)</Text>
            <View style={{ position: 'absolute', right: 10 }}>
                <Icon name='plus-circle' type='feather' size={30} onPress={() => Alert.alert("添加聊天")}></Icon>
            </View>
        </View>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <FlatList data={data} renderItem={renderItem}>
            </FlatList>
        </View>
    </SafeAreaView>
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    content: {
        flex: 1,
    }
})

export default Session