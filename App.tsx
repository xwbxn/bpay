import { loadAsync } from 'expo-font';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { AppRegistry } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import { MenuProvider } from 'react-native-popup-menu';
import { RootSiblingParent } from 'react-native-root-siblings';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createTheme, ThemeProvider } from '@rneui/themed';
import ReactNativeForegroundService from '@xwbxn/rn-foreground-service';

import ForwardMessage from './screens/chat/forwardMessage';
import HomeScreen from './screens/home';
import PostDetail from './screens/posts/detail';
import Login from './screens/profile/login';
import Splash from './Splash';
import { IProfile, useGlobalState, useProfile } from './store/globalContext';
import { useMatrixClient } from './store/useMatrixClient';
import Profile from './screens/profile/profile';
import Qrcode from './screens/chat/qrcode';
import Register from './screens/profile/register';

//@ts-ignore
global.DOMException = function DOMException(message, name) {
  console.log(message, name);
};

// notification task
ReactNativeForegroundService.register();

AppRegistry.registerComponent("ShareMenuModuleComponent", () => ForwardMessage);

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
  const { profile, hasHydrated } = useProfile()

  async function allowsNotificationsAsync() {
    const settings = await Notifications.getPermissionsAsync();
    return (
      settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    );
  }

  useEffect(() => {
    if (hasHydrated && profile.matrixAuth) {
      client.credentials.userId = profile.matrixAuth.user_id
      client.setAccessToken(profile.matrixAuth.access_token)
      setStore(profile.matrixAuth.user_id)
      client.startClient()
      console.debug('------------- starting client --------------')
    }
  }, [hasHydrated])

  useEffect(() => {
    const prepare = async () => {
      await loadAsync({
        'fontello': require('./assets/fonts/font/fontello.ttf'),
      })

      await SplashScreen.hideAsync();

      // 检查通知权限
      if (! await allowsNotificationsAsync()) {
        await Notifications.requestPermissionsAsync()
      }

      ReactNativeForegroundService.start({
        id: 1,
        title: "BPay",
        message: `正在运行`
      })

      setTimeout(() => {
        setAppIsReady(true)
      }, 3000);
    }
    prepare()

    return () => {
      ReactNativeForegroundService.stopAll();
    }
  }, [])

  if (!appIsReady) {
    return <Splash />;
  }

  SplashScreen.hideAsync()
  return <><RootSiblingParent>
    <Spinner visible={loading}></Spinner>
    <ThemeProvider theme={theme}>
      <MenuProvider>
        <NavigationContainer>
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
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="Qrcode" component={Qrcode}/>
            <Stack.Screen name="Register" component={Register} />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar backgroundColor={theme.lightColors.primary} style="light" />
      </MenuProvider>
    </ThemeProvider>
  </RootSiblingParent></>
}
