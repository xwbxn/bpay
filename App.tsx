import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createTheme, ThemeProvider } from '@rneui/themed';
import { MenuProvider } from 'react-native-popup-menu';

import HomeScreen from './screens/home';
import PostDetail from './screens/posts/detail';
import Login from './screens/profile/login';
import { GlobalContext, IGlobalContext } from './store/globalContext';
import { useMatrixClient } from './store/useMatrixClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const theme = createTheme({
});
const Stack = createNativeStackNavigator();


export default function App() {

  const { client } = useMatrixClient()

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


  const [globalState, setGlobalState] = useState<IGlobalContext>({
    ready: true,
    categories: [],

    setCategories(state) {
      setGlobalState({
        ...globalState,
        categories: state
      })
    },
  })



  return (
    <GlobalContext.Provider value={globalState}>
      <ThemeProvider theme={theme}>
        <MenuProvider>
          {globalState.ready &&
            <NavigationContainer>
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="PostDetail" component={PostDetail} />
                <Stack.Screen name="Login" component={Login} />
              </Stack.Navigator>
            </NavigationContainer>}
          <StatusBar backgroundColor={theme.lightColors.primary} style="light" />
        </MenuProvider>
      </ThemeProvider>
    </GlobalContext.Provider>
  );
}
