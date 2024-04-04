import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Badge, Icon, Image, useTheme } from '@rneui/themed';

import { getCategories } from '../../service/wordpress';
import { useMatrixClient } from '../../store/useMatrixClient';
import { ChatIndex } from '../chat';
import PostList from '../posts/list';
import { RoomEvent } from 'matrix-js-sdk';
import { useGlobalState } from '../../store/globalContext';
import { appEmitter } from '../../utils/event';

const Tab = createBottomTabNavigator();

const infoIcon = require("../../assets/images/information.png");
const recoIcon = require('../../assets/images/recommend.png')
const inviIcon = require('../../assets/images/investing.png')
const follIcon = require('../../assets/images/follow.png')
const chatIcon = require('../../assets/images/chatting.png')

export default function HomeScreen({ navigation }) {

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
        <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen options={{
                tabBarIcon: ({ color }) => <Image style={styles.iconStyle} source={infoIcon}></Image>,
                title: '币看',
                tabBarLabelStyle: { color: theme.colors.primary }
            }} name="Information" component={PostList} initialParams={{ id: 78 }} />
            <Tab.Screen options={{
                tabBarIcon: ({ color }) => <Image style={styles.iconStyle} source={recoIcon}></Image>,
                title: '币推',
                tabBarLabelStyle: { color: theme.colors.primary }
            }} name="Recommend" component={PostList} initialParams={{ id: 79 }} />
            <Tab.Screen options={{
                tabBarIcon: ({ color }) => <Image style={styles.iconStyle} source={chatIcon}></Image>,
                title: '聊天',
                tabBarLabelStyle: { color: theme.colors.primary },
                tabBarBadge: unReadTotal > 0 ? unReadTotal : null
            }} name="Chatting" component={ChatIndex} />
            <Tab.Screen options={{
                tabBarIcon: ({ color }) => <Image style={styles.iconStyle} source={infoIcon}></Image>,
                title: '币投',
                tabBarLabelStyle: { color: theme.colors.primary }
            }} name="Investing" component={PostList} initialParams={{ id: 80 }} />
            <Tab.Screen options={{
                tabBarIcon: ({ color }) => <Image style={styles.iconStyle} source={follIcon}></Image>,
                title: '币跟',
                tabBarLabelStyle: { color: theme.colors.primary }
            }} name="Follow" component={PostList} initialParams={{ id: 81 }} />
        </Tab.Navigator>
    </>
}

const styles = StyleSheet.create({
    iconStyle: {
        width: 28,
        height: 28,
    }
})