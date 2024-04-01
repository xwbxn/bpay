import React, { useEffect } from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@rneui/themed';

import { useMatrixClient } from '../../store/useMatrixClient';
import { Contacts } from './contacts';
import { GroupChat } from './groups';
import { MemberProfile } from './member';
import { Room } from './room';
import { RoomSetting } from './roomSetting';
import Session from './sessions';
import { RoomAdmin } from './roomSetting/roomAdmin';

const Stack = createNativeStackNavigator();
export const ChatIndex = ({ navigation, route }) => {

    const { theme } = useTheme()
    const { client } = useMatrixClient()

    useEffect(() => {
        if (!client.clientRunning) {
            navigation.replace('Login')
        }
    }, [])


    return <>
        <Stack.Navigator screenOptions={{
            headerTitleAlign: 'center',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.background,
            headerTitleStyle: { fontWeight: 'bold' }
        }}>
            <Stack.Screen name="Sessions" component={Session} />
            <Stack.Screen name="Room" component={Room} />
            <Stack.Screen name="Contact" component={Contacts} />
            <Stack.Screen name="GroupChat" component={GroupChat} />
            <Stack.Screen name='RoomSetting' component={RoomSetting} />
            <Stack.Screen name='RoomAdmin' component={RoomAdmin} />
            <Stack.Screen name='Member' component={MemberProfile} />
        </Stack.Navigator>
    </>
}