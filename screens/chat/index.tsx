import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@rneui/themed';
import React from 'react'
import { Invite } from './invite';
import { Room } from './room';
import { RoomSetting } from './roomSetting';
import Session from './sessions';

const Stack = createNativeStackNavigator();
export const ChatIndex = () => {

    const { theme } = useTheme()

    return <>
        <Stack.Navigator screenOptions={{
            headerTitleAlign: 'center',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.background,
            headerTitleStyle: { fontWeight: 'bold' }
        }}>
            <Stack.Screen name="Sessions" component={Session} />
            <Stack.Screen name="Room" component={Room} />
            <Stack.Screen name="Invite" component={Invite} />
            <Stack.Screen name='RoomSetting' component={RoomSetting} />
        </Stack.Navigator>
    </>
}