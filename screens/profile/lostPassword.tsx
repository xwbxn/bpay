import React, { useRef, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Button, Header, Icon, Input, Text, useTheme } from '@rneui/themed';

import { useGlobalState, useProfile } from '../../store/globalContext';
import Recaptcha, { RecaptchaRef } from 'react-native-recaptcha-that-works';
import Toast from 'react-native-root-toast';
import { resetPassword, sendCode } from '../../service/wordpress';

export default function LostPassword({ navigation, route }) {

    const { theme } = useTheme()
    const { setLoading } = useGlobalState()

    const [username, setUsername] = useState('')
    const [vcode, setVcode] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [step, setStep] = useState(0)
    const [showPassword, setShowPassword] = useState(false)

    const recaptcha = useRef<RecaptchaRef>(null);

    const doSendMail = async (token) => {
        if (username == '') {
            Toast.show('请输入用户名', { duration: Toast.durations.SHORT, position: Toast.positions.CENTER, shadow: true, animation: true, hideOnPress: true, delay: 0, onHidden: () => { } })
            return
        }
        setLoading(true)
        try {
            await sendCode({ username, code: token })
            Toast.show('验证码已发送到注册邮箱', { duration: Toast.durations.SHORT, position: Toast.positions.CENTER, shadow: true, animation: true, hideOnPress: true, delay: 0, onHidden: () => { } })
            setStep(1)
        } catch (error) {
            Alert.alert('错误', error.toString())
        } finally {
            setLoading(false)
        }
    }

    const onSendMail = () => {
        recaptcha.current.open()
    }

    const onResetPassword = async () => {
        if (vcode == '') {
            Toast.show('请输入验证码', { duration: Toast.durations.SHORT, position: Toast.positions.CENTER, shadow: true, animation: true, hideOnPress: true, delay: 0, onHidden: () => { } })
            return
        }
        if (password.length < 6) {
            Toast.show('密码长度不能小于6位', { duration: Toast.durations.SHORT, position: Toast.positions.CENTER, shadow: true, animation: true, hideOnPress: true, delay: 0, onHidden: () => { } })
            return
        }
        if (password !== confirmPassword) {
            Toast.show('两次输入的密码不一致', { duration: Toast.durations.SHORT, position: Toast.positions.CENTER, shadow: true, animation: true, hideOnPress: true, delay: 0, onHidden: () => { } })
            return
        }
        setLoading(true)
        try {
            const res = await resetPassword({ username, password, vcode })
            if (res.result) {
                Toast.show('密码重置成功', { duration: Toast.durations.SHORT, position: Toast.positions.CENTER, shadow: true, animation: true, hideOnPress: true, delay: 0, onHidden: () => { } })
                navigation.replace('Login')
            } else {
                Toast.show('验证码错误', { duration: Toast.durations.SHORT, position: Toast.positions.CENTER, shadow: true, animation: true, hideOnPress: true, delay: 0, onHidden: () => { } })
            }
        } catch (error) {
            Alert.alert('错误', error.toString())
        } finally {
            setLoading(false)
        }
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
                        <Text h3>找回密码</Text>
                    </View>
                    <View style={{ alignItems: 'center', paddingHorizontal: 0, marginTop: 40 }} >
                        {step === 0 && <Input placeholder='用户名'
                            errorStyle={{ height: 0 }}
                            inputContainerStyle={{ paddingHorizontal: 16, borderWidth: 0, borderBottomWidth: 0, borderRadius: 10, height: 50 }}
                            onChangeText={setUsername} value={username}></Input>}
                        {step === 1 && <Input placeholder='验证码'
                            errorStyle={{ height: 0 }}
                            inputContainerStyle={{ paddingHorizontal: 16, borderWidth: 0, borderBottomWidth: 0, borderRadius: 10, height: 50 }}
                            onChangeText={setVcode} value={vcode}></Input>}
                        {step === 1 && <Input placeholder='新密码'
                            errorStyle={{ height: 0 }}
                            rightIcon={<Icon size={20} name={showPassword ? 'eye' : 'eye-closed'} type='octicon'
                                onPress={() => setShowPassword(!showPassword)}></Icon>}
                            secureTextEntry={!showPassword}
                            inputContainerStyle={{ paddingHorizontal: 16, borderWidth: 0, borderBottomWidth: 0, borderRadius: 10, height: 50 }}
                            onChangeText={setPassword} value={password}></Input>}
                        {step === 1 && <Input placeholder='确认密码'
                            errorStyle={{ height: 0 }}
                            rightIcon={<Icon size={20} name={showPassword ? 'eye' : 'eye-closed'} type='octicon'
                                onPress={() => setShowPassword(!showPassword)}></Icon>}
                            secureTextEntry={!showPassword}
                            inputContainerStyle={{ paddingHorizontal: 16, borderWidth: 0, borderBottomWidth: 0, borderRadius: 10, height: 50 }}
                            onChangeText={setConfirmPassword} value={confirmPassword}></Input>}
                        <Recaptcha
                            ref={recaptcha}
                            siteKey="6LeBW8opAAAAAKpTg4n7EoIGFQdkV8nvNGueEwdI"
                            baseUrl="https://www.b-pay.ilfe"
                            onVerify={doSendMail}
                            size='invisible'
                            recaptchaDomain='www.recaptcha.net'
                            onError={(err) => {
                                // Alert.alert('onError event');
                                console.warn(err);
                            }}
                        />
                    </View>
                    <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
                        {step === 0 && <Button disabled={username.length === 0} radius={10}
                            onPress={() => onSendMail()}>{'下一步'}</Button>}
                        {step === 1 && <Button disabled={vcode.length === 0 || password.length < 6 || password !== confirmPassword} radius={10}
                            onPress={() => onResetPassword()}>{'确定'}</Button>}
                    </View>
                </View>
            </ScrollView>
        </View>
    </>
}