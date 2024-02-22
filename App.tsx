import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';

import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createTheme, FAB, Icon, ThemeProvider } from '@rneui/themed';

import HomeScreen from './screens/home';
// import PostDetail from './screens/posts/webDetail';
import PostDetail from './screens/posts/detail';
import { GlobalContext, IGlobalContext } from './store/globalContext';
import { Chat } from './screens/chat';

const theme = createTheme({
});
const Stack = createNativeStackNavigator();

export default function App() {

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
        {globalState.ready &&
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="PostDetail" component={PostDetail} />
              <Stack.Screen name="Chat" component={Chat} />
            </Stack.Navigator>
          </NavigationContainer>}
        <StatusBar backgroundColor={theme.lightColors.primary} style="light" />
      </ThemeProvider>
    </GlobalContext.Provider>
  );
}
