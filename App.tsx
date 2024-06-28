import './wdyr'; // <--- first import

import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

import { loadAsync } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import React, { useEffect, useState } from 'react';
import { AppRegistry } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import { MenuProvider } from 'react-native-popup-menu';
import { RootSiblingParent } from 'react-native-root-siblings';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createTheme, ThemeProvider } from '@rneui/themed';
import ReactNativeForegroundService from '@xwbxn/rn-foreground-service';

import CameraPicker from './screens/chat/components/Camera';
import ForwardMessage from './screens/chat/forwardMessage';
import Qrcode from './screens/chat/qrcode';
import HomeScreen from './screens/home';
import PostDetail from './screens/posts/detail';
import AdvProfile from './screens/profile/advProfile';
import Checkout from './screens/profile/checkout';
import DebugInfo from './screens/profile/debugInfo';
import DeleteProfile from './screens/profile/deleteProfile';
import Login from './screens/profile/login';
import LostPassword from './screens/profile/lostPassword';
import Membership from './screens/profile/membership';
import Orders from './screens/profile/orders';
import Profile from './screens/profile/profile';
import Register from './screens/profile/register';
import Transations from './screens/profile/transations';
import UpdatePassword from './screens/profile/updatePassword';
import Welcome from './screens/profile/welcome';
import Splash from './Splash';
import { useGlobalState } from './store/globalContext';
import { useProfile } from './store/profileContext';

//dayjs
dayjs.locale('zh-cn') // 使用本地化语言
//@ts-ignore
global.DOMException = function DOMException(message, name) {
  console.log(message, name);
};

// 注册为前台服务，用于显示通知 notification task
ReactNativeForegroundService.register();

// 接受分享
AppRegistry.registerComponent("ShareMenuModuleComponent", () => ForwardMessage);

// 主题颜色
const theme = createTheme({
  lightColors: {
    primary: '#3259CE'
  }
});

// 最外层堆栈导航器
const Stack = createNativeStackNavigator();

// 开屏画面保持显示，手动切换
SplashScreen.preventAutoHideAsync();

export default function App() {

  const [appIsReady, setAppIsReady] = useState(false)
  const { loading, setLoading } = useGlobalState()
  const { profile, hasHydrated, loginWithToken } = useProfile()

  async function onFetchUpdateAsync() {
    try {
      const update = await Updates.checkForUpdateAsync();
      console.log('update', update.isAvailable)

      if (update.isAvailable) {
        setLoading(true)
        await Updates.fetchUpdateAsync();
        alert(`检测到更新，即将重新加载应用`);
        setLoading(false)
        await Updates.reloadAsync();
      }
    } catch (error) {
      setLoading(false)
      alert(`Error fetching latest Expo update: ${error}`);
    }
  }

  // 使用已保存的凭证登陆后台
  useEffect(() => {
    if (hasHydrated && profile.authenticated && profile.matrixAuth) {
      loginWithToken(profile.matrixAuth.access_token)
    }
  }, [hasHydrated])

  // 整体初始化
  useEffect(() => {
    const prepare = async () => {
      await loadAsync({
        'fontello': require('./assets/fonts/font/fontello.ttf'),
      })

      await onFetchUpdateAsync()
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

  // 初始化未完成时显示开屏画面
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
            <Stack.Screen name="transaction" component={Transations} />
            <Stack.Screen name='AdvancedSetting' component={AdvProfile} />
            <Stack.Screen name='DeleteProfile' component={DeleteProfile} />
            <Stack.Screen name="Qrcode" component={Qrcode} />
            <Stack.Screen name="Register" component={Register} />
            <Stack.Screen name="Welcome" component={Welcome} />
            <Stack.Screen name='UpdatePassword' component={UpdatePassword} />
            <Stack.Screen name='LostPassword' component={LostPassword} />
            <Stack.Screen name='Camera' component={CameraPicker} />
            <Stack.Screen name='DebugInfo' component={DebugInfo} />
            <Stack.Screen name='Membership' component={Membership} />
            <Stack.Screen name='Checkout' component={Checkout} />
            <Stack.Screen name='Orders' component={Orders} />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar backgroundColor={theme.lightColors.primary} style="light" />
      </MenuProvider>
    </ThemeProvider>
  </RootSiblingParent></>
}
