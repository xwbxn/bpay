import { encode as base64_encode } from 'base-64';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Icon, Image, Input, Text, useTheme } from '@rneui/themed';
import { getAuth, getMatrixAuth } from '../../service/wordpress';
import { useGlobalState, useProfile } from '../../store/globalContext';
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
    const { setLoading } = useGlobalState()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [setProfile] = useProfile((state) => [state.setProfile])

    const onLoginPress = async () => {
        if (!username || !password) {
            Alert.alert("请填写用户名和密码")
            return
        }
        await AsyncStorage.removeItem("TOKEN")
        const token = `Basic ${base64_encode(`${username}:${password}`)}`
        try {
            setLoading(true)
            const bpayRes = await getAuth(token)
            const profile = {
                id: bpayRes.id,
                name: bpayRes.name,
                avatar: bpayRes.avatar_urls["24"],
                authenticated: true
            }
            setProfile(profile)
            await AsyncStorage.setItem("TOKEN", token)
            const chatAuth = await getMatrixAuth()
            const chatRes = await client.loginWithPassword(`@${chatAuth.username}:chat.b-pay.life`, chatAuth.random_password)
            AsyncStorage.setItem("MATRIX_AUTH", JSON.stringify(chatRes))
            if (client.clientRunning) {
                client.stopClient()
                client.clearStores()
            }
            client.startClient()
            navigation.replace('Home')
        } catch (err) {
            console.log('err', err)
            if (err.data?.code === "invalid_username") {
                Alert.alert("用户名或密码错")
            } else {
                Alert.alert(err.toString())
            }
        } finally {
            setLoading(false)
        }
    }

    return <>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
            <KeyboardAvoidingView behavior='padding' style={{ justifyContent: 'flex-end' }}>
                <View style={{ alignItems: 'center', paddingTop: 40 }}>
                    <Image resizeMethod='scale' style={{ width: 200, height: 200 }} resizeMode='stretch' source={require('../../assets/icon.png')}></Image>
                </View>
                <View style={{ alignItems: 'center', paddingHorizontal: 40, marginTop: 60 }} >
                    <Input placeholder='用户名'
                        inputContainerStyle={{ paddingHorizontal: 16, borderWidth: 1, borderRadius: 10, height: 40 }} onChangeText={setUsername} value={username}></Input>
                    <Input placeholder='密码'
                        inputContainerStyle={{ paddingHorizontal: 16, borderWidth: 1, borderRadius: 10, height: 40 }}
                        rightIcon={<Icon size={10} name={showPassword ? 'eye' : 'eye-closed'} type='octicon'
                            onPressIn={() => setShowPassword(true)}
                            onPressOut={() => setShowPassword(false)}></Icon>}
                        secureTextEntry={!showPassword} onChangeText={setPassword} value={password}></Input>
                </View>
                <View style={{ paddingHorizontal: 50 }}>
                    <Button radius={10} onPress={() => onLoginPress()}>登录</Button>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    </>
}