import * as Application from 'expo-application';
import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Image } from '@rneui/themed';

export default function Splash() {

    const { height, width } = useWindowDimensions()

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Image source={require('./assets/splash.png')} resizeMode='contain' style={{ width, height }}></Image>
            <View style={styles.version}>
                <Text>Version: {Application.nativeApplicationVersion}</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    version: {
        position: 'absolute',
        zIndex: 999,
        bottom: 50
    }
})