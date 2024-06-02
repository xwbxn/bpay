import React, { useRef, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Button, Header, Icon, Input, Text, useTheme } from '@rneui/themed';

import { useGlobalState } from '../../store/globalContext';
import { updatePassword } from '../../service/wordpress';
import Toast from 'react-native-root-toast';

export default function UpdatePassword({ navigation, route }) {

    const { theme } = useTheme()
    const { setLoading } = useGlobalState()

    const [oldPassword, setOldPassword] = useState('')
    const [password, setPassword] = useState('')
    const [rePassword, setRePassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)



    const onUpdatePassword = () => {
        if (password.length < 6) {
            Alert.alert('密码错误', '密码至少6个字符')
            return
        }
        if (password !== rePassword) {
            Alert.alert('密码错误', '两次输入的密码不一致')
            return
        }
        doUpdatePassword()
    }

    const doUpdatePassword = async () => {
        setLoading(true)
        try {
            const res = await updatePassword({ prev_password: oldPassword, password })
            if (res.result) {
                Toast.show('修改成功', { duration: Toast.durations.SHORT, position: Toast.positions.CENTER })
                navigation.goBack()
            } else {
                Alert.alert('错误', res.message)
            }
        } catch (err) {
            Alert.alert('异常', JSON.stringify(err))
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
                        <Text h3>修改密码</Text>
                    </View>
                    <View style={{ alignItems: 'center', paddingHorizontal: 0, marginTop: 40 }} >
                        <Input placeholder='旧密码'
                            errorStyle={{ height: 0 }}
                            inputContainerStyle={{ paddingHorizontal: 16, borderWidth: 0, borderBottomWidth: 0, borderRadius: 10, height: 50 }}
                            rightIcon={<Icon size={20} name={showPassword ? 'eye' : 'eye-closed'} type='octicon'
                                onPress={() => setShowPassword(!showPassword)}></Icon>}
                            secureTextEntry={!showPassword} onChangeText={setOldPassword} value={oldPassword}></Input>
                        <Input placeholder='新密码'
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
                    <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
                        <Button disabled={rePassword.length === 0 || password.length === 0 || oldPassword.length === 0} radius={10}
                            onPress={() => onUpdatePassword()}>修改密码</Button>

                    </View>
                </View>
            </ScrollView>
        </View>
    </>
}