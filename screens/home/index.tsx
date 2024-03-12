import React, { useContext, useEffect } from 'react';
import { View } from 'react-native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Badge, Icon } from '@rneui/themed';

import { getCategories } from '../../service/wordpress';
import { useMatrixClient } from '../../store/chat';
import { GlobalContext } from '../../store/globalContext';
import { ChatIndex } from '../chat';
import PostList from '../posts/list';

const Tab = createBottomTabNavigator();

export default function HomeScreen({ navigation }) {

    const { login, unReadCount } = useMatrixClient()

    const { setCategories } = useContext(GlobalContext)
    useEffect(() => {
        getCategories({
            orderby: 'slug'
        }).then(res => {
            setCategories(res)
        })

        login("@admin:chat.b-pay.life", "8675309Abcd!@#")
    }, [])

    return <>
        <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen options={{ tabBarIcon: ({ color }) => <Icon name='infocirlce' type='antdesign' color={color}></Icon> }} name="币看" component={PostList} initialParams={{ id: 78 }} />
            <Tab.Screen options={{ tabBarIcon: ({ color }) => <Icon name='recommend' type='material' color={color}></Icon> }} name="币推" component={PostList} initialParams={{ id: 79 }} />
            <Tab.Screen options={{
                tabBarIcon: ({ color }) => {
                    return <View>
                        {unReadCount > 0 && <Badge containerStyle={{ position: 'absolute', zIndex: 999, right: -10, top: -10 }} value={unReadCount} status="error"></Badge>}
                        <Icon name='wechat' type='font-awesome' color={color}>
                        </Icon></View>
                }
            }} name="聊天" component={ChatIndex} />
            <Tab.Screen options={{ tabBarIcon: ({ color }) => <Icon name='bitcoin-circle' type='foundation' color={color}></Icon> }} name="币投" component={PostList} initialParams={{ id: 80 }} />
            <Tab.Screen options={{ tabBarIcon: ({ color }) => <Icon name='groups' type='material' color={color}></Icon> }} name="币跟" component={PostList} initialParams={{ id: 81 }} />
        </Tab.Navigator>
    </>
}