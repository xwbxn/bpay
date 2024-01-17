import React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createTheme, ThemeProvider } from '@rneui/themed';

import HomeScreen from './screens/home';
import PostDetail from './screens/posts/detail';

const theme = createTheme({
});

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen options={{headerShown: false}} name="Home" component={HomeScreen} />
          <Stack.Screen name="PostDetail" component={PostDetail} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
