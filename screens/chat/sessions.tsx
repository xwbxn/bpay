import React, { useEffect, useState } from 'react'
import { FlatList, TouchableOpacity, View, StyleSheet, Alert } from 'react-native'
import { Badge, Divider, Icon, Image, Text, useTheme } from '@rneui/themed'
import { SafeAreaView } from 'react-native-safe-area-context'
import moment from 'moment'
import 'moment/locale/zh-cn'
import * as sdk from "matrix-js-sdk";
import { ClientEvent } from 'matrix-js-sdk'


const Session = ({ route, navigation }) => {

    const { theme } = useTheme()
    const [data, setData] = useState([])

    useEffect(() => {
        const sessions = [
            {
                id: 1,
                name: 'D.T 亚军',
                avatar: 'http://47.98.235.243:4880/wp-content/uploads/avatars/7/1705296704-bpthumb.jpg',
                label: "欢迎大家来到数字部落",
                unread: 5,
                updateAt: '2024-02-16 18:33:23'
            },
            {
                id: 2,
                name: 'DT 大宇',
                avatar: 'http://47.98.235.243:4880/wp-content/uploads/avatars/9/1705653207-bpthumb.png',
                label: "这里是聊聊天的",
                unread: 0,
                updateAt: '2024-02-15 18:33:23'
            },
            {
                id: 3,
                name: "币看-群聊",
                label: "谁知道这是什么？",
                avatar: "http://47.98.235.243:4880/wp-content/uploads/2024/01/4b1eaf5c410549159a5d5f4d953dafd8.jpeg",
                unread: 0,
                updateAt: '2024-02-13 18:33:23'
            }
        ]
        setData(sessions)
    }, [])

    useEffect(() => {
        const myUserId = "@admin:chat.b-pay.life";
        const myAccessToken = "syt_YWRtaW4_deSSmMRjVEdTnzglDEBB_0wK3He";
        const matrixClient = sdk.createClient({
            baseUrl: "https://chat.b-pay.life",
            accessToken: myAccessToken,
            userId: myUserId,
            useAuthorizationHeader: true
        });
        matrixClient.whoami().then(r => {
            console.log('r', r.user_id)
        })
    }, [])

    const onPress = (item) => {
        navigation.push('Chat')
    }

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => onPress(item)}>
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8 }}>
                <View>
                    <Image style={{ height: 50, width: 50 }} source={{ uri: item.avatar }}></Image>
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