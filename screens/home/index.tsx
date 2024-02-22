import React, { useContext, useEffect } from 'react';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { getCategories } from '../../service/wordpress';
import { GlobalContext } from '../../store/globalContext';
import PostList from '../posts/list';
import { FAB, Icon, useTheme } from '@rneui/themed';
import { Chat } from '../chat';
import Session from '../chat/sessions';

const Tab = createBottomTabNavigator();

export default function HomeScreen({ navigation }) {

    const { setCategories } = useContext(GlobalContext)
    const { theme } = useTheme()

    useEffect(() => {
        getCategories({
            orderby: 'slug'
        }).then(res => {
            setCategories(res)
        })
    }, [])

    return <>
        <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen options={{ tabBarIcon: ({ color }) => <Icon name='infocirlce' type='antdesign' color={color}></Icon> }} name="资讯" component={PostList} initialParams={{ id: 78 }} />
            <Tab.Screen options={{ tabBarIcon: ({ color }) => <Icon name='recommend' type='material' color={color}></Icon> }} name="聊天" component={Session} />
            <Tab.Screen options={{ tabBarIcon: ({ color }) => <Icon name='bitcoin-circle' type='foundation' color={color}></Icon> }} name="直播" component={PostList} initialParams={{ id: 80 }} />
            <Tab.Screen options={{ tabBarIcon: ({ color }) => <Icon name='groups' type='material' color={color}></Icon> }} name="一对一" component={PostList} initialParams={{ id: 81 }} />
        </Tab.Navigator>
        {/* <FAB placement="right" size='small' color={theme.colors.primary}
            style={{ top: 250, right: -10 }}
            onPress={() => {
                navigation.navigate('Chat')
            }}
            icon={<Icon name="chatbubbles-outline" type='ionicon' color={theme.colors.background}></Icon>}></FAB> */}
    </>
}