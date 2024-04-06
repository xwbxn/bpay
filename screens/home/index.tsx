import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { registerCustomIconType, useTheme, Icon } from '@rneui/themed';

import { getCategories } from '../../service/wordpress';
import { useMatrixClient } from '../../store/useMatrixClient';
import { ChatIndex } from '../chat';
import PostList from '../posts/list';
import { RoomEvent } from 'matrix-js-sdk';
import { useGlobalState } from '../../store/globalContext';
import { appEmitter } from '../../utils/event';
import { createIconSetFromFontello } from 'react-native-vector-icons';
import fontelloConfig from '../../assets/fonts/config.json';

const fontelloIcon = createIconSetFromFontello(fontelloConfig);

const Tab = createBottomTabNavigator();

export default function HomeScreen({ navigation }) {

    registerCustomIconType('fontello', fontelloIcon)
    const { client } = useMatrixClient()
    const [unReadTotal, setUnReadTotal] = useState(0)
    const { setCategories } = useGlobalState()
    const { theme } = useTheme()

    useEffect(() => {
        getCategories({
            orderby: 'slug'
        }).then(res => {
            setCategories(res)
        })
    }, [])

    useEffect(() => {
        const refreshUnreadTotal = () => {
            setUnReadTotal(client.getRooms().reduce((count, room) => count + room.getUnreadNotificationCount() + (room.getMyMembership() === 'invite' ? 1 : 0), 0))
        }
        refreshUnreadTotal()
        client.on(RoomEvent.Timeline, refreshUnreadTotal)
        client.on(RoomEvent.Receipt, refreshUnreadTotal)
        client.on(RoomEvent.MyMembership, refreshUnreadTotal)
        return () => {
            client.off(RoomEvent.Timeline, refreshUnreadTotal)
            client.off(RoomEvent.Receipt, refreshUnreadTotal)
            client.off(RoomEvent.MyMembership, refreshUnreadTotal)
        }
    }, [])

    useEffect(() => {
        const toLogin = () => {
            navigation.replace('Login')
        }
        appEmitter.on('TO_LOGIN', toLogin)

        return () => {
            appEmitter.off('TO_LOGIN', toLogin)
        }
    }, [])


    return <>
        <Tab.Navigator screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.colors.primary,
        }}>
            <Tab.Screen options={{
                tabBarIcon: ({ color }) => <Icon size={30} iconStyle={styles.iconStyle} name='infomation' type='fontello' color={color}></Icon>,
                title: '币看',
            }} name="Information" component={PostList} initialParams={{ id: 78 }} />
            <Tab.Screen options={{
                tabBarIcon: ({ color }) => <Icon size={30} iconStyle={styles.iconStyle} name='recommend' type='fontello' color={color}></Icon>,
                title: '币推',
            }} name="Recommend" component={PostList} initialParams={{ id: 79 }} />
            <Tab.Screen options={{
                tabBarIcon: ({ color }) => <Icon size={30} iconStyle={styles.iconStyle} name='chat' type='fontello' color={color}></Icon>,
                title: '聊天',
                tabBarBadge: unReadTotal > 0 ? unReadTotal : null
            }} name="Chatting" component={ChatIndex} />
            <Tab.Screen options={{
                tabBarIcon: ({ color }) => <Icon size={30} iconStyle={styles.iconStyle} name='invest' type='fontello' color={color}></Icon>,
                title: '币投',
            }} name="Investing" component={PostList} initialParams={{ id: 80 }} />
            <Tab.Screen options={{
                tabBarIcon: ({ color }) => <Icon size={30} iconStyle={styles.iconStyle} name='follow' type='fontello' color={color}></Icon>,
                title: '币跟',
            }} name="Follow" component={PostList} initialParams={{ id: 81 }} />
        </Tab.Navigator>
    </>
}

const styles = StyleSheet.create({
    iconStyle: {
        width: 30,
        height: 30,
    }
})