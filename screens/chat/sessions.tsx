import React, { useEffect, useState } from 'react'
import { FlatList, TouchableOpacity, View, StyleSheet, Alert } from 'react-native'
import { Avatar, Badge, Divider, Icon, Image, Text, useTheme } from '@rneui/themed'
import { SafeAreaView } from 'react-native-safe-area-context'
import moment from 'moment'
import 'moment/locale/zh-cn'
import { useMatrixClient } from '../../store/chat'


const Session = ({ route, navigation }) => {

    const { theme } = useTheme()
    const [data, setData] = useState([])
    const { client, rooms, setCurrentRoom } = useMatrixClient()

    useEffect(() => {
        setData(rooms.map(v => {
            const lastMsg = v.getLastLiveEvent()
            const label = lastMsg.event.type === "m.room.encrypted" ? "加密消息" : lastMsg.event.content.body
            const updatedAt = moment(lastMsg.getDate()).fromNow()
            return {
                id: v.roomId,
                name: v.name,
                label: label,
                unread: v.getUnreadNotificationCount(),
                updatedAt: updatedAt,
                room: v
            }
        }))
    }, [rooms])

    const onPress = (item) => {
        setCurrentRoom(item.room)
        navigation.push('Room')
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
                    <Text style={{ fontSize: 12, color: theme.colors.grey3 }}>{item.updatedAt}</Text>
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