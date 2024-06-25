import React, { useRef, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import ParsedText from 'react-native-parsed-text';
import * as Linking from 'expo-linking';

import { Button, CheckBox, Header, Icon, Input, Text, useTheme } from '@rneui/themed';
import Recaptcha, { RecaptchaRef } from 'react-native-recaptcha-that-works';

import { useGlobalState } from '../../store/globalContext';
import { useProfile } from '../../store/profileContext';

export default function Register({ navigation, route }) {

    const { theme } = useTheme()
    const { setLoading } = useGlobalState()

    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [rePassword, setRePassword] = useState('')
    const [agreement, setAgreement] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const { register } = useProfile()

    const recaptcha = useRef<RecaptchaRef>(null);


    const onRegister = () => {
        if (!isValid(username)) {
            Alert.alert('提示', '用户名只能是小写字母、数字和下划线')
            return
        }
        if (username.length < 5) {
            Alert.alert('用户名错误', '用户名至少5个字符')
            return
        }
        if (username.length > 16) {
            Alert.alert('用户名错误', '用户名不能超过16个字符')
            return
        }
        if (email.length == 0) {
            Alert.alert('邮箱错误', '请正确输入邮箱地址')
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
        if (!agreement) {
            Alert.alert('提示', '请勾选同意用户协议')
            return
        }
        recaptcha.current.open()
    }

    const doRegister = async (code) => {
        const data = {
            username,
            email,
            password,
            agreement: true,
            code
        }
        setLoading(true)
        try {
            await register(data)
            navigation.popToTop()
            navigation.replace('Home')
        } catch (err) {
            Alert.alert('注册失败', err.message)
        } finally {
            setLoading(false)
        }
    }

    const onExpire = () => {
        console.warn('expired!');
    }

    return <>
        <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
            <Header leftComponent={<Icon name='arrow-back' color={theme.colors.background} onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.replace('Home')}></Icon>}></Header>
            <ScrollView>
                <View style={{ flex: 1 }}>
                    <View style={{
                        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                        paddingVertical: 20, paddingHorizontal: 26, marginTop: 0
                    }}>
                        <Text h3>用户注册</Text>
                        <Button type='clear' onPress={() => navigation.navigate('Login')}>已有账户</Button>
                    </View>
                    <View style={{ alignItems: 'center', paddingHorizontal: 0, marginTop: 40 }} >
                        <Input placeholder='用户名'
                            errorStyle={{ height: 0 }}
                            inputContainerStyle={{ paddingHorizontal: 16, borderWidth: 0, borderBottomWidth: 0, borderRadius: 10, height: 50 }}
                            onChangeText={setUsername} value={username}></Input>
                        <Input placeholder='邮箱'
                            errorStyle={{ height: 0 }}
                            inputContainerStyle={{ paddingHorizontal: 16, borderWidth: 0, borderBottomWidth: 0, borderRadius: 10, height: 50 }}
                            onChangeText={setEmail} value={email}></Input>
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
                        <Recaptcha
                            ref={recaptcha}
                            siteKey="6LeBW8opAAAAAKpTg4n7EoIGFQdkV8nvNGueEwdI"
                            baseUrl="https://www.b-pay.ilfe"
                            onVerify={doRegister}
                            onExpire={onExpire}
                            size='invisible'
                            recaptchaDomain='www.recaptcha.net'
                            onError={(err) => {
                                // Alert.alert('onError event');
                                console.warn(err);
                            }}
                        />
                    </View>
                    <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                        <Button disabled={username.length === 0 || password.length === 0} radius={10} onPress={onRegister}>注册</Button>
                        <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center' }}>
                            <CheckBox checked={agreement} onPress={() => setAgreement(!agreement)} size={16} containerStyle={{ padding: 0, marginLeft: 0, marginRight: 0 }}></CheckBox>
                            <ParsedText parse={[
                                { pattern: /《用户服务协议》/, style: { color: theme.colors.primary }, onPress: () => Linking.openURL('https://www.b-pay.life/html/service.html') },
                                { pattern: /《隐私政策》/, style: { color: theme.colors.primary }, onPress: () => Linking.openURL('https://www.b-pay.life/html/privacy_policy.html') }
                            ]}>已阅读并同意《用户服务协议》、《隐私政策》</ParsedText>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    </>
}

function isValid(str) {
    return /^[a-z0-9_]+$/.test(str);
}