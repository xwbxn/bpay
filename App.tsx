import 'dayjs/locale/zh-cn';
import dayjs from 'dayjs'

import { loadAsync } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { AppRegistry } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import { MenuProvider } from 'react-native-popup-menu';
import { RootSiblingParent } from 'react-native-root-siblings';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createTheme, ThemeProvider } from '@rneui/themed';
import ReactNativeForegroundService from '@xwbxn/rn-foreground-service';

import ForwardMessage from './screens/chat/forwardMessage';
import Qrcode from './screens/chat/qrcode';
import HomeScreen from './screens/home';
import PostDetail from './screens/posts/detail';
import Login from './screens/profile/login';
import Profile from './screens/profile/profile';
import Register from './screens/profile/register';
import Welcome from './screens/profile/welcome';
import Splash from './Splash';
import { useGlobalState, useProfile } from './store/globalContext';
import { useMatrixClient } from './store/useMatrixClient';

//dayjs
dayjs.locale('zh-cn') // 使用本地化语言
console.log('dayjs(new Date()', dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss'))
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
  const { profile, hasHydrated, loginWithToken } = useProfile()

  useEffect(() => {
    if (hasHydrated && profile.authenticated && profile.matrixAuth) {
      loginWithToken(profile.matrixAuth.access_token)
      console.debug('------------- starting client --------------')
    }
  }, [hasHydrated])

  useEffect(() => {
    const prepare = async () => {
      await loadAsync({
        'fontello': require('./assets/fonts/font/fontello.ttf'),
      })

      await SplashScreen.hideAsync();

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
          <Stack.Navigator initialRouteName={profile.authenticated ? 'Home' : 'Welcome'}
            screenOptions={{
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
            <Stack.Screen name="Qrcode" component={Qrcode} />
            <Stack.Screen name="Register" component={Register} />
            <Stack.Screen name="Welcome" component={Welcome} />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar backgroundColor={theme.lightColors.primary} style="light" />
      </MenuProvider>
    </ThemeProvider>
  </RootSiblingParent></>
}
