import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createTheme, FAB, Icon, ThemeProvider } from '@rneui/themed';

import HomeScreen from './screens/home';
// import PostDetail from './screens/posts/webDetail';
import PostDetail from './screens/posts/detail';
import { GlobalContext, IGlobalContext } from './store/globalContext';

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
            </Stack.Navigator>
          </NavigationContainer>}
        <FAB placement="right" size='small' color={theme.lightColors.primary}
          style={{ top: 250, right: -10 }}
          icon={<Icon name="chatbubbles-outline" type='ionicon' color={theme.lightColors.background}></Icon>}></FAB>
        <StatusBar backgroundColor={theme.lightColors.primary} style="light" />
      </ThemeProvider>
    </GlobalContext.Provider>
  );
}
