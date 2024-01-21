import { useContext, useEffect } from 'react';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { getCategories } from '../../service/wordpress';
import { GlobalContext } from '../../store/globalContext';
import PostList from '../posts/list';
import { Icon } from '@rneui/themed';

const Tab = createBottomTabNavigator();

export default function HomeScreen({ navigation }) {

    const { setCategories } = useContext(GlobalContext)

    useEffect(() => {
        getCategories().then(res => {
            setCategories(res)
        })
    }, [])

    return <>
        <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen options={{ tabBarIcon: ({ color }) => <Icon name='infocirlce' type='antdesign' color={color}></Icon> }} name="币看" component={PostList} initialParams={{ id: 78 }} />
            <Tab.Screen options={{ tabBarIcon: ({ color }) => <Icon name='recommend' type='material' color={color}></Icon> }} name="币推" component={PostList} initialParams={{ id: 79 }} />
            <Tab.Screen options={{ tabBarIcon: ({ color }) => <Icon name='bitcoin-circle' type='foundation' color={color}></Icon> }} name="币投" component={PostList} initialParams={{ id: 80 }} />
            <Tab.Screen options={{ tabBarIcon: ({ color }) => <Icon name='groups' type='material' color={color}></Icon> }} name="币跟" component={PostList} initialParams={{ id: 81 }} />
        </Tab.Navigator></>
}