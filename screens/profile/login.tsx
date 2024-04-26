import { encode as base64_encode } from 'base-64';
import React, { useState } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Avatar, Button, Header, Icon, Input, Text, useTheme } from '@rneui/themed';

import { getAuth, getMatrixAuth } from '../../service/wordpress';
import { useGlobalState, useProfile } from '../../store/globalContext';
import { useMatrixClient } from '../../store/useMatrixClient';
import { normalizeUserId } from '../../utils';

export default function Login({ navigation, route }) {

    const { theme } = useTheme()
    const { client, setStore } = useMatrixClient()
    const { setLoading } = useGlobalState()
    const { login, profile } = useProfile()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const onLoginPress = async () => {
        if (!username || !password) {
            Alert.alert("请填写用户名和密码")
            return
        }
        doLogin()
    }

    const doLogin = async () => {
        const token = `Basic ${base64_encode(`${username}:${password}`)}`
        try {
            setLoading(true)
            await AsyncStorage.setItem("TOKEN", token)
            const bpayUser = await getAuth(token)
            const chatSecret = await getMatrixAuth()
            const chatAuth = await client.loginWithPassword(`@${chatSecret.username}:chat.b-pay.life`, chatSecret.random_password)
            const chatProfile = await client.getProfileInfo(chatAuth.user_id)
            await login(bpayUser, token, chatAuth, chatProfile)
            if (client.clientRunning) {
                client.stopClient()
            }
            setStore(chatAuth.user_id)
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

    let avatar = null
    if (profile.avatar) {
        avatar = <Avatar source={{ uri: profile.avatar }} size={50} rounded
            onPress={() => setUsername(normalizeUserId(profile.matrixId) || '')}
            containerStyle={{ backgroundColor: theme.colors.primary }}
        ></Avatar>
    } else if (profile.name) {
        avatar = <Avatar title={profile.name.slice(0)} size={50} rounded
            onPress={() => setUsername(normalizeUserId(profile.matrixId) || '')}
            containerStyle={{ backgroundColor: theme.colors.primary }}
        ></Avatar>
    }

    return <>
        <Header leftComponent={<Icon name='arrow-back' color={theme.colors.background} onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.replace('Home')}></Icon>}></Header>
        <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
            <View style={{
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                paddingTop: 26, paddingHorizontal: 20, marginTop: 0
            }}>
                <Text h3>密码登录</Text>
                {avatar}
            </View>
            <View style={{ flex: 1, paddingHorizontal: 0, marginTop: 60 }} >
                <Input placeholder='手机/用户名'
                    errorStyle={{ height: 0 }}
                    inputContainerStyle={{ paddingHorizontal: 16, borderWidth: 0, borderBottomWidth: 0, borderRadius: 10, height: 50 }}
                    onChangeText={setUsername} value={username}></Input>
                <Input placeholder='密码'
                    errorStyle={{ height: 0 }}
                    inputContainerStyle={{ paddingHorizontal: 16, borderWidth: 0, borderBottomWidth: 0, borderRadius: 10, height: 50 }}
                    rightIcon={<Icon size={20} name={showPassword ? 'eye' : 'eye-closed'} type='octicon'
                        onPress={() => setShowPassword(!showPassword)}></Icon>}
                    secureTextEntry={!showPassword} onChangeText={setPassword} value={password}></Input>
                <View style={{ paddingHorizontal: 20 }}>
                    <Button disabled={username.length === 0 || password.length === 0} radius={10}
                        onPress={() => onLoginPress()}>登录</Button>

                </View>
                <View style={{ marginTop: 14, marginHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TouchableOpacity onPress={() => navigation.push('Register')}>
                        <Text style={{ color: theme.colors.primary }}>找回密码</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.push('Register')}>
                        <Text style={{ color: theme.colors.primary }}>用户注册</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>

    </>
}