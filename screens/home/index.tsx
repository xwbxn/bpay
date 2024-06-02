import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { registerCustomIconType, useTheme, Icon } from '@rneui/themed';
import ShareMenu from "@xwbxn/react-native-share-menu";

import { getCategories, getMembershipLevels } from '../../service/wordpress';
import { useMatrixClient } from '../../store/useMatrixClient';
import { ChatIndex } from '../chat';
import PostList from '../posts/list';
import { RoomEvent } from 'matrix-js-sdk';
import { useGlobalState } from '../../store/globalContext';
import { useProfile } from '../../store/profileContext';
import { appEmitter } from '../../utils/event';
import { createIconSetFromFontello } from 'react-native-vector-icons';
import fontelloConfig from '../../assets/fonts/config.json';

const fontelloIcon = createIconSetFromFontello(fontelloConfig);

const Tab = createBottomTabNavigator();

export default function HomeScreen({ navigation, route }) {
    const { client } = useMatrixClient()
    const [unReadTotal, setUnReadTotal] = useState(0)
    const { setCategories, showbottomTabBar, setShowBottomTabBar, setMembershipLevels } = useGlobalState()
    const { theme } = useTheme()
    const { profile } = useProfile()

    const handleShare = useCallback((item) => {
        if (!item) {
            return;
        }
        const { mimeType, data, extraData } = item;
        if (data && mimeType) {
            if (mimeType &&
                (mimeType.startsWith("image/") ||
                    mimeType.startsWith("video/") ||
                    mimeType.startsWith("application/"))) {
                navigation.navigate('Chatting', {
                    screen: 'ForwardMessage',
                    params: { target: data, mimetype: mimeType, roomId: undefined }
                })
            }
        }
    }, []);

    useEffect(() => {
        ShareMenu.getInitialShare(handleShare);
        const listener = ShareMenu.addNewShareListener(handleShare);
        return () => {
            listener.remove();
        };
    }, []);

    useEffect(() => {
        setShowBottomTabBar(profile.roles?.includes('contributor'))
    }, [profile.roles])


    useEffect(() => {
        const unsubscribe = navigation.addListener('state', (e) => {
            // do something
            const topStack = e.data.state.routes[e.data.state.index]
            if (topStack.name === 'Home') {
                const tabPage = topStack.state?.routes[topStack.state.index]
                if (tabPage?.name === 'Chatting') {
                    const chattingPage = tabPage.state?.routes[tabPage.state.index]
                    profile.roles?.includes('contributor') && setShowBottomTabBar(chattingPage?.name !== 'Room')
                }
            }
        });

        return unsubscribe;
    }, [navigation, profile.roles])


    registerCustomIconType('fontello', fontelloIcon)

    // 全局状态更新
    useEffect(() => {
        getCategories({
            orderby: 'slug'
        }).then(res => {
            setCategories(res)
        })

        getMembershipLevels().then(res => {
            setMembershipLevels(res)
        })
    }, [])

    useEffect(() => {
        const refreshUnreadTotal = () => {
            setUnReadTotal(client.getRooms().reduce((count, room) => count + room.getUnreadNotificationCount(), 0))
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
        <Tab.Navigator initialRouteName='Chatting' screenOptions={{
            tabBarHideOnKeyboard: true,
            tabBarStyle: { display: showbottomTabBar ? undefined : 'none' },
            headerShown: false,
            tabBarActiveTintColor: theme.colors.primary,
        }}>
            {profile.roles?.includes('contributor') && <Tab.Screen options={{
                tabBarIcon: ({ color }) => <Icon size={30} iconStyle={styles.iconStyle} name='infomation' type='fontello' color={color}></Icon>,
                title: '币看',
            }} name="Information" component={PostList} initialParams={{ id: 78 }} />}
            {profile.roles?.includes('contributor') && <Tab.Screen options={{
                tabBarIcon: ({ color }) => <Icon size={30} iconStyle={styles.iconStyle} name='recommend' type='fontello' color={color}></Icon>,
                title: '币推',
            }} name="Recommend" component={PostList} initialParams={{ id: 79 }} />}
            <Tab.Screen options={{
                tabBarIcon: ({ color }) => <Icon size={30} iconStyle={styles.iconStyle} name='chat' type='fontello' color={color}></Icon>,
                title: '聊天',
                tabBarBadge: unReadTotal > 0 ? unReadTotal : null
            }} name="Chatting" component={ChatIndex} />
            {profile.roles?.includes('contributor') && <Tab.Screen options={{
                tabBarIcon: ({ color }) => <Icon size={30} iconStyle={styles.iconStyle} name='invest' type='fontello' color={color}></Icon>,
                title: '币投',
            }} name="Investing" component={PostList} initialParams={{ id: 80 }} />}
            {profile.roles?.includes('contributor') && <Tab.Screen options={{
                tabBarIcon: ({ color }) => <Icon size={30} iconStyle={styles.iconStyle} name='follow' type='fontello' color={color}></Icon>,
                title: '币跟',
            }} name="Follow" component={PostList} initialParams={{ id: 81 }} />}
        </Tab.Navigator>
    </>
}

const styles = StyleSheet.create({
    iconStyle: {
        width: 30,
        height: 30,
    }
})