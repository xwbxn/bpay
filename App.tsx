import { loadAsync, useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
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
import { IProfile, useGlobalState, useProfile } from './store/globalContext';
import { useMatrixClient } from './store/useMatrixClient';

const theme = createTheme({
  lightColors: {
    primary: '#3259CE'
  }
});
const Stack = createNativeStackNavigator();
SplashScreen.preventAutoHideAsync();

export default function App() {

  const [appIsReady, setAppIsReady] = useState(false)
  const { client, setStore } = useMatrixClient()
  const { loading } = useGlobalState()
  const { setProfile } = useProfile()

  useEffect(() => {
    const prepare = async () => {
      AsyncStorage.getItem("MATRIX_AUTH").then(data => {
        if (data) {
          const auth: { user_id: string, access_token: string, refresh_token: string } = JSON.parse(data)
          console.log('auth', auth)
          client.credentials.userId = auth.user_id
          client.setAccessToken(auth.access_token)
          setStore(auth.user_id)
          client.startClient()
        }
      })
      AsyncStorage.getItem("PROFILE").then(data => {
        if (data) {
          const profile: IProfile = JSON.parse(data)
          setProfile(profile)
        }
      })
      await loadAsync({
        'fontello': require('./assets/fonts/font/fontello.ttf'),
      })

      await SplashScreen.hideAsync();
      setAppIsReady(true)
    }

    prepare()
  }, [])

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      setTimeout(() => {
        SplashScreen.hideAsync();
      }, 1000);
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return <><RootSiblingParent>
    <Spinner visible={loading}></Spinner>
    <ThemeProvider theme={theme}>
      <MenuProvider>
        <NavigationContainer onReady={onLayoutRootView}>
          <Stack.Navigator screenOptions={{
            headerShown: false,
            headerTitleAlign: 'center',
            headerStyle: { backgroundColor: theme.lightColors.primary },
            headerTintColor: theme.lightColors.background,
            headerTitleStyle: { fontWeight: 'bold' }
          }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="PostDetail" component={PostDetail} />
            <Stack.Screen name="Login" component={Login} />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar backgroundColor={theme.lightColors.primary} style="light" />
      </MenuProvider>
    </ThemeProvider>
  </RootSiblingParent></>
}
