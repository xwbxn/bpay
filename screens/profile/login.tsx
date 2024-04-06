import { encode as base64_encode } from 'base-64';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, useWindowDimensions, View } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, Header, Icon, Image, Input, useTheme } from '@rneui/themed';

import { getAuth, getMatrixAuth } from '../../service/wordpress';
import { useGlobalState, useProfile } from '../../store/globalContext';
import { useMatrixClient } from '../../store/useMatrixClient';

export default function Login({ navigation, route }) {

    const { theme } = useTheme()
    const { width } = useWindowDimensions()
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
            }
            client.startClient()
            navigation.replace('Home')
        } catch (err) {
            console.log('err', err)
            if (err.data?.code.match(/invalid_username|incorrect_password/)) {
                Alert.alert("用户名或密码错")
            } else {
                Alert.alert(err.toString())
            }
        } finally {
            setLoading(false)
        }
    }

    return <>
        <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
            <Header leftComponent={<Icon name='arrow-back' color={theme.colors.background} onPress={() => navigation.goBack()}></Icon>}></Header>
            <KeyboardAvoidingView behavior='padding' style={{ justifyContent: 'flex-end' }}>
                <View style={{ alignItems: 'center', paddingTop: 0 }}>
                    <Image resizeMethod='scale' style={{ width: width / 1, height: width / 1 }} resizeMode='stretch'
                        source={require('../../assets/login.jpg')}></Image>
                </View>
                <View style={{ alignItems: 'center', paddingHorizontal: 29, marginTop: 0 }} >
                    <Input placeholder='用户名'
                        inputContainerStyle={{ paddingHorizontal: 16, borderWidth: 1, borderRadius: 10, height: 40 }} onChangeText={setUsername} value={username}></Input>
                    <Input placeholder='密码'
                        inputContainerStyle={{ paddingHorizontal: 16, borderWidth: 1, borderRadius: 10, height: 40 }}
                        rightIcon={<Icon size={20} name={showPassword ? 'eye' : 'eye-closed'} type='octicon'
                            onPressIn={() => setShowPassword(true)}
                            onPressOut={() => setShowPassword(false)}></Icon>}
                        secureTextEntry={!showPassword} onChangeText={setPassword} value={password}></Input>
                </View>
                <View style={{ paddingHorizontal: 36 }}>
                    <Button radius={10} onPress={() => onLoginPress()}>登录</Button>
                </View>
            </KeyboardAvoidingView>
        </View>
    </>
}