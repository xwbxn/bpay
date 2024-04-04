import * as Notifications from 'expo-notifications';

import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import Spinner from 'react-native-loading-spinner-overlay';
import { MenuProvider } from 'react-native-popup-menu';
import { RootSiblingParent } from 'react-native-root-siblings';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createTheme, ThemeProvider } from '@rneui/themed';

import HomeScreen from './screens/home';
import PostDetail from './screens/posts/detail';
import Login from './screens/profile/login';
import { useGlobalState } from './store/globalContext';
import { useMatrixClient } from './store/useMatrixClient';

const theme = createTheme({
  lightColors: {
    primary: '#3259CE'
  }
});
const Stack = createNativeStackNavigator();

// First, set the handler that will cause the notification
// to show the alert

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});


export default function App() {

  const { client } = useMatrixClient()
  const { loading } = useGlobalState()

  useEffect(() => {
    AsyncStorage.getItem("MATRIX_AUTH").then(data => {
      if (data) {
        const auth: { user_id: string, access_token: string, refresh_token: string } = JSON.parse(data)
        console.log('auth', auth)
        client.credentials.userId = auth.user_id
        client.setAccessToken(auth.access_token)
        client.startClient()
      }
    })
  }, [])

  return <>
    <RootSiblingParent>
      <Spinner visible={loading}></Spinner>
      <ThemeProvider theme={theme}>
        <MenuProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="PostDetail" component={PostDetail} />
              <Stack.Screen name="Login" component={Login} />
            </Stack.Navigator>
          </NavigationContainer>
          <StatusBar backgroundColor={theme.lightColors.primary} style="light" />
        </MenuProvider>
      </ThemeProvider>
    </RootSiblingParent>
  </>
}
