import { useEffect } from 'react';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import PostList from '../posts/list';

const Tab = createBottomTabNavigator();

export default function HomeScreen({ navigation }) {

    useEffect(() => {
        navigation.setOptions({
            headerShown: false
        })
    }, [])

    return <>
        <Tab.Navigator>
            <Tab.Screen name="币看" component={PostList} initialParams={{ category: '币看' }} />
            <Tab.Screen name="币推" component={PostList} initialParams={{ category: '币推' }} />
            <Tab.Screen name="币投" component={PostList} initialParams={{ category: '币投' }} />
            <Tab.Screen name="币跟" component={PostList} initialParams={{ category: '币跟' }} />
        </Tab.Navigator></>
}