import React, { useCallback, useRef, useState } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import Recaptcha, { RecaptchaRef } from 'react-native-recaptcha-that-works';

import { Avatar, Button, Icon, Input, Text, useTheme } from '@rneui/themed';

import BpayHeader from '../../components/BpayHeader';
import { useGlobalState } from '../../store/globalContext';
import { useProfile } from '../../store/profileContext';
import { normalizeUserId } from '../../utils';

export default function Login({ navigation, route }) {

    const { theme } = useTheme()
    const { setLoading } = useGlobalState()
    const { login, profile } = useProfile()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const recaptcha = useRef<RecaptchaRef>(null);

    const onLoginPress = async () => {
        if (!username || !password) {
            Alert.alert("请填写用户名和密码")
            return
        }
        recaptcha.current.open()
    }

    const doLogin = async (code) => {
        try {
            setLoading(true)
            await login(username, password, code)
            navigation.popToTop()
            navigation.replace('Home')
        } catch (err) {
            console.log('err', err)
            if (err.data?.code.match(/invalid_username|incorrect_password/)) {
                Alert.alert("用户名或密码错")
            } else if (err.errcode && err.errcode === 'M_LIMIT_EXCEEDED') {
                Alert.alert("操作过于频繁，请稍后再试")
            } else {
                Alert.alert(err.toString())
            }
        } finally {
            setLoading(false)
        }
    }

    const onExpire = () => {
        console.warn('expired!');
    }

    const renderAvatar = useCallback(() => {
        if (profile.avatar) {
            return <Avatar source={{ uri: profile.avatar }} size={50} rounded
                onPress={() => setUsername(normalizeUserId(profile.matrixId) || '')}
                containerStyle={{ backgroundColor: theme.colors.primary }}
            ></Avatar>
        } else if (profile.name) {
            return <Avatar title={profile.name[0].toUpperCase()} size={50} rounded
                onPress={() => setUsername(normalizeUserId(profile.matrixId) || '')}
                containerStyle={{ backgroundColor: theme.colors.primary }}
            ></Avatar>
        }
    }, [profile, theme])

    return <>
        <BpayHeader title='用户登录' leftComponent={<Icon name='arrow-back' color={theme.colors.background}
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.replace('Home')}></Icon>} />
        <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
            <View style={{
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                paddingVertical: 20, paddingHorizontal: 26, marginTop: 0
            }}>
                <Text h3>密码登录</Text>
                {renderAvatar()}
            </View>
            <View style={{ flex: 1, marginTop: 40 }} >
                <Input placeholder='用户名'
                    errorStyle={{ height: 0 }}
                    inputContainerStyle={{ paddingHorizontal: 16, borderWidth: 0, borderBottomWidth: 0, borderRadius: 10, height: 50 }}
                    onChangeText={setUsername} value={username}></Input>
                <Input placeholder='密码'
                    errorStyle={{ height: 0 }}
                    inputContainerStyle={{ paddingHorizontal: 16, borderWidth: 0, borderBottomWidth: 0, borderRadius: 10, height: 50 }}
                    rightIcon={<Icon size={20} name={showPassword ? 'eye' : 'eye-closed'} type='octicon'
                        onPress={() => setShowPassword(!showPassword)}></Icon>}
                    secureTextEntry={!showPassword} onChangeText={setPassword} value={password}></Input>
                <Recaptcha
                    ref={recaptcha}
                    siteKey="6LeBW8opAAAAAKpTg4n7EoIGFQdkV8nvNGueEwdI"
                    baseUrl="https://www.b-pay.ilfe"
                    onVerify={doLogin}
                    onExpire={onExpire}
                    size='invisible'
                    recaptchaDomain='www.recaptcha.net'
                    onError={(err) => {
                        // Alert.alert('onError event');
                        console.warn(err);
                    }}
                />

                <View style={{ paddingHorizontal: 20 }}>
                    <Button disabled={username.length === 0 || password.length === 0} radius={10}
                        onPress={() => onLoginPress()}>登录</Button>

                </View>
                <View style={{ marginTop: 14, marginHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TouchableOpacity onPress={() => navigation.push('LostPassword')}>
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