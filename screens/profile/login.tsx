import { decode as base64_decode, encode as base64_encode } from 'base-64';
import React, { useContext, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Image, Input, Text } from '@rneui/themed';
import { getAuth } from '../../service/wordpress';
import { GlobalContext } from '../../store/globalContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Login() {

    const { height } = useWindowDimensions()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    const { setProfiles } = useContext(GlobalContext)

    const onLoginPress = () => {
        console.log('username', username)
        const token = `Basic ${base64_encode(`${username}:${password}`)}`
        getAuth(token).then(res => {
            console.log('res', res)
            setProfiles({
                id: res.id,
                name: res.name,
                avatar: res.avatar_urls["24"]
            })
            AsyncStorage.setItem("TOKEN", token)
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
                <Button onPress={() => onLoginPress()}>登录</Button>
            </View>
        </SafeAreaView>
    </>
}