import React, { useContext, useEffect } from 'react';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@rneui/themed';

import { getCategories } from '../../service/wordpress';
import { GlobalContext } from '../../store/globalContext';
import Session from '../chat/sessions';
import PostList from '../posts/list';
import { useChatClient } from '../../store/chat';
import { ClientEvent, createClient } from 'matrix-js-sdk';

const Tab = createBottomTabNavigator();

export default function HomeScreen({ navigation }) {

    const { setCategories } = useContext(GlobalContext)
    useEffect(() => {
        getCategories({
            orderby: 'slug'
        }).then(res => {
            setCategories(res)
        })
    }, [])

    const [setChatClient, setRooms] = useChatClient(state => [state.setChatClient, state.setRooms])
    useEffect(() => {
        (async () => {
            const client = createClient({
                baseUrl: 'https://chat.b-pay.life',
                useAuthorizationHeader: true,
                userId: "@admin:chat.b-pay.life",
                accessToken: "syt_YWRtaW4_QUAdKRdXtXFhHHMNUKWY_3uebAn",
                deviceId: "aaaabb"
            })
            client.on(ClientEvent.Sync, (state) => {
                switch (state) {
                    case 'PREPARED':
                        const rooms = client.getRooms()
                        setRooms(rooms)
                        break;
                }
            })

            try {
                await client.initCrypto()
                await client.setGlobalErrorOnUnknownDevices(false)
            } catch { }
            await client.startClient()

            setChatClient(client)
        })()

    }, [])

    return <>
        <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen options={{ tabBarIcon: ({ color }) => <Icon name='infocirlce' type='antdesign' color={color}></Icon> }} name="币看" component={PostList} initialParams={{ id: 78 }} />
            <Tab.Screen options={{ tabBarIcon: ({ color }) => <Icon name='recommend' type='material' color={color}></Icon> }} name="币推" component={PostList} initialParams={{ id: 79 }} />
            <Tab.Screen options={{ tabBarIcon: ({ color }) => <Icon name='wechat' type='font-awesome' color={color}></Icon> }} name="聊天" component={Session} />
            <Tab.Screen options={{ tabBarIcon: ({ color }) => <Icon name='bitcoin-circle' type='foundation' color={color}></Icon> }} name="币投" component={PostList} initialParams={{ id: 80 }} />
            <Tab.Screen options={{ tabBarIcon: ({ color }) => <Icon name='groups' type='material' color={color}></Icon> }} name="币跟" component={PostList} initialParams={{ id: 81 }} />
        </Tab.Navigator>
    </>
}