import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@rneui/themed';

import { Contacts } from './contacts';
import { GroupChat } from './groups';
import { MemberProfile } from './member';
import { Room } from './room';
import { RoomSetting } from './roomSetting';
import Session from './sessions';
import { RoomAdmin } from './roomSetting/roomAdmin';
import RoomDocuments from './roomSetting/attachments';
import PlayVideo from './playVideo';
import Qrcode from './qrcode';
import RoomPreview from './roomPreview';
import ForwardMessage from './forwardMessage';
import SearchMessage from './searchMessage';

const Stack = createNativeStackNavigator();
export const ChatIndex = ({ navigation, route }) => {

    const { theme } = useTheme()
    return <>
        <Stack.Navigator screenOptions={{
            headerShown: false,
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
            <Stack.Screen name='Documents' component={RoomDocuments} />
            <Stack.Screen name='PlayVideo' component={PlayVideo} />
            <Stack.Screen name='Qrcode' component={Qrcode} />
            <Stack.Screen name='RoomPreview' component={RoomPreview} />
            <Stack.Screen name='ForwardMessage' component={ForwardMessage} />
            <Stack.Screen name='SearchMessage' component={SearchMessage} />
        </Stack.Navigator>
    </>
}