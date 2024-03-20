import { encode as base64_encode } from 'base-64';
import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Image, Input, Text, useTheme } from '@rneui/themed';
import { getAuth } from '../../service/wordpress';
import { useProfile } from '../../store/globalContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMatrixClient } from '../../store/useMatrixClient';

export default function Login({ navigation, route }) {

    const { theme } = useTheme()

    useEffect(() => {
        navigation.setOptions({
            headerShown: true,
            title: '登录',
            headerTitleAlign: 'center',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.background,
            headerTitleStyle: { fontWeight: 'bold' }
        })
    }, [])


    const { client } = useMatrixClient()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [setProfile, setMatrixToken] = useProfile((state) => [state.setProfile, state.setMatrixToken])

    const onLoginPress = () => {
        AsyncStorage.removeItem("TOKEN").then(() => {
            const token = `Basic ${base64_encode(`${username}:${password}`)}`
            return getAuth(token).then(res => {
                const profile = {
                    id: res.id,
                    name: res.name,
                    avatar: res.avatar_urls["24"],
                    authenticated: true
                }
                setProfile(profile)
                AsyncStorage.setItem("TOKEN", token)
                navigation.replace('Home')
            })
        }).catch(res => {
            if (res.data?.code === "invalid_username") {
                Alert.alert("用户名或密码错")
            }
        })
    }

    const onMatrixLogin = () => {
        client.loginWithPassword(username, password).then(res => {
            AsyncStorage.setItem("MATRIX_AUTH", JSON.stringify(res))
            if (client.clientRunning) {
                client.stopClient()
            }
            client.startClient()
            navigation.replace('Home')
        }).catch(res => {
            Alert.alert(res.toString())
        })
    }

    return <>
        <SafeAreaView style={{ padding: 20 }}>
            <View style={{ alignItems: 'center', height: '20%' }}>
                <Text style={{ fontSize: 90 }}>BPay</Text>
            </View>
            <View style={{ alignItems: 'center', height: '40%' }}>
                <Image style={{ width: 200, height: 200 }} source={require('../../assets/icon.png')}></Image>
            </View>
            <View style={{ alignItems: 'center' }} >
                <Input label="用户名" onChangeText={setUsername} value={username}></Input>
                <Input label="密码" secureTextEntry onChangeText={setPassword} value={password}></Input>
            </View>
            <View style={{ padding: 10 }}>
                <Button onPress={() => onMatrixLogin()}>登录</Button>
            </View>
        </SafeAreaView>
    </>
}