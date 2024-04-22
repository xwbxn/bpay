import { View, Text } from 'react-native'
import React from 'react'
import { Image } from '@rneui/themed'

export default function Splash() {
    return (
        <View style={{ flex: 1, alignItems: 'center' }}>
            <Image source={require('./assets/splash.png')} width={284}></Image>
        </View>
    )
}