import { encode as base64_encode } from 'base-64';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, View } from 'react-native';
import ParsedText from 'react-native-parsed-text';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Avatar, Button, CheckBox, Dialog, Header, Icon, Input, Text, useTheme } from '@rneui/themed';

import { getAuth, getMatrixAuth, getSmsCode, register } from '../../service/wordpress';
import { useGlobalState, useProfile } from '../../store/globalContext';
import { useMatrixClient } from '../../store/useMatrixClient';
import Toast from 'react-native-root-toast';

export default function Register({ navigation, route }) {

    const { theme } = useTheme()
    const { client, setStore } = useMatrixClient()
    const { setLoading } = useGlobalState()

    const [username, setUsername] = useState('')
    const [mobile, setMobile] = useState('')
    const [password, setPassword] = useState('')
    const [rePassword, setRePassword] = useState('')
    const [smscode, setSmscode] = useState('')
    const [smsCD, setSmsCD] = useState(0)
    const interval = useRef(null)
    const [agreement, setAgreement] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [privicyBox, setPrivicyBox] = useState(false)
    const { login } = useProfile()

    const sendSmsCode = async () => {
        if (mobile.length < 11) {
            Alert.alert('手机号错误', '请输入正确的手机号')
            return
        }
        const res = await getSmsCode(mobile)
        if (res.result) {
            Toast.show(res.message.code, {
                position: Toast.positions.CENTER
            })
            setSmsCD(60)
            if (!interval.current) {
                interval.current = setInterval(() => {
                    setSmsCD(state => state - 1)
                }, 1000)
            }
        } else {
            Alert.alert('发送失败', res.message)
        }
    }

    const onRegister = () => {
        if (username.length < 3) {
            Alert.alert('用户名错误', '用户名至少3个字符')
            return
        }
        if (mobile.length < 11) {
            Alert.alert('手机号错误', '请输入正确的手机号')
            return
        }
        if (password.length < 6) {
            Alert.alert('密码错误', '密码至少6个字符')
            return
        }
        if (password !== rePassword) {
            Alert.alert('密码错误', '两次输入的密码不一致')
            return
        }
        if (smscode.length !== 6) {
            Alert.alert('验证码错误', '请输入正确的验证码')
            return
        }
        if (!agreement) {
            alert('请勾选同意用户协议')
        }
        doRegister()
    }

    const doRegister = async () => {
        const data = {
            username,
            mobile,
            password,
            smscode,
            agreement: true
        }
        setLoading(true)
        const res = await register(data)
        if (res.result) {
            const token = `Basic ${base64_encode(`${username}:${password}`)}`
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
            setLoading(false)
            navigation.replace('Home')
        } else {
            setLoading(false)
            Alert.alert('注册失败', res.message)
        }
    }

    useEffect(() => {
        if (smsCD === 0) {
            clearInterval(interval.current)
            interval.current = null
        }
    }, [smsCD])


    return <>
        <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
            <KeyboardAvoidingView behavior='padding' style={{ justifyContent: 'flex-end' }}>
                <Header leftComponent={<Icon name='arrow-back' color={theme.colors.background} onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.replace('Home')}></Icon>}></Header>
                <View style={{
                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    paddingTop: 26, paddingHorizontal: 20, marginTop: 0
                }}>
                    <Text h3>用户注册</Text>
                </View>
                <View style={{ alignItems: 'center', paddingHorizontal: 0, marginTop: 40 }} >
                    <Input placeholder='用户名'
                        errorStyle={{ height: 0 }}
                        inputContainerStyle={{ paddingHorizontal: 16, borderWidth: 0, borderBottomWidth: 0, borderRadius: 10, height: 50 }}
                        onChangeText={setUsername} value={username}></Input>
                    <Input placeholder='手机号'
                        errorStyle={{ height: 0 }}
                        inputContainerStyle={{ paddingHorizontal: 16, borderWidth: 0, borderBottomWidth: 0, borderRadius: 10, height: 50 }}
                        onChangeText={setMobile} value={mobile}></Input>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                        <Input placeholder='验证码'
                            errorStyle={{ height: 0 }}
                            inputContainerStyle={{ paddingHorizontal: 16, borderWidth: 0, borderBottomWidth: 0, borderRadius: 10, height: 50 }}
                            onChangeText={setSmscode} value={smscode}></Input>
                        <Button containerStyle={{ position: 'absolute', right: 20, top: 6 }}
                            title={`发送验证码${smsCD > 0 ? `(${smsCD})` : ''}`}
                            onPress={sendSmsCode}
                            disabled={smsCD > 0}
                            size='sm' type='outline'>
                        </Button>
                    </View>
                    <Input placeholder='密码'
                        errorStyle={{ height: 0 }}
                        inputContainerStyle={{ paddingHorizontal: 16, borderWidth: 0, borderBottomWidth: 0, borderRadius: 10, height: 50 }}
                        rightIcon={<Icon size={20} name={showPassword ? 'eye' : 'eye-closed'} type='octicon'
                            onPress={() => setShowPassword(!showPassword)}></Icon>}
                        secureTextEntry={!showPassword} onChangeText={setPassword} value={password}></Input>
                    <Input placeholder='再次输入密码'
                        errorStyle={{ height: 0 }}
                        inputContainerStyle={{ paddingHorizontal: 16, borderWidth: 0, borderBottomWidth: 0, borderRadius: 10, height: 50 }}
                        rightIcon={<Icon size={20} name={showPassword ? 'eye' : 'eye-closed'} type='octicon'
                            onPress={() => setShowPassword(!showPassword)}></Icon>}
                        secureTextEntry={!showPassword} onChangeText={setRePassword} value={rePassword}></Input>
                </View>
                <View style={{ paddingHorizontal: 20 }}>
                    <Button disabled={username.length === 0 || password.length === 0} radius={10} onPress={() => { onRegister }}>注册</Button>
                    <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center' }}>
                        <CheckBox checked={agreement} onPress={() => setAgreement(!agreement)} size={16} containerStyle={{ padding: 0, marginLeft: 0, marginRight: 0 }}></CheckBox>
                        <ParsedText parse={[
                            { pattern: /《用户服务协议》/, style: { color: theme.colors.primary } },
                            { pattern: /《隐私政策》/, style: { color: theme.colors.primary } }
                        ]}>已阅读并同意《用户服务协议》、《隐私政策》</ParsedText>
                    </View>
                </View>

            </KeyboardAvoidingView>
            <Dialog isVisible={privicyBox}>
                <ParsedText parse={[
                    { pattern: /《用户服务协议》/, style: { color: theme.colors.primary } },
                    { pattern: /《隐私政策》/, style: { color: theme.colors.primary } }
                ]}>请您认证阅读《用户服务协议》、《隐私政策》的全部条款，接收后可开始使用我们的服务</ParsedText>
                <Dialog.Actions>
                    <Dialog.Button size='lg' title={'同意'} onPress={() => { }}></Dialog.Button>
                    <Dialog.Button size='lg' title={'不同意'} onPress={() => setPrivicyBox(false)} titleStyle={{ color: 'grey' }}></Dialog.Button>
                </Dialog.Actions>
            </Dialog>
        </View>
    </>
}