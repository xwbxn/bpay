import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useContext, useEffect } from 'react';
import { getCategories } from '../../service/wordpress';
import { GlobalContext } from '../../store/globalContext';

import PostList from '../posts/list';

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
            <Tab.Screen name="币看" component={PostList} initialParams={{ id: 78 }} />
            <Tab.Screen name="币推" component={PostList} initialParams={{ id: 79 }} />
            <Tab.Screen name="币投" component={PostList} initialParams={{ id: 80 }} />
            <Tab.Screen name="币跟" component={PostList} initialParams={{ id: 81 }} />
        </Tab.Navigator></>
}