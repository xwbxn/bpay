import React, { useRef, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Button, Header, Icon, Input, Text, useTheme } from '@rneui/themed';

import { useGlobalState, useProfile } from '../../store/globalContext';
import Recaptcha, { RecaptchaRef } from 'react-native-recaptcha-that-works';
import Toast from 'react-native-root-toast';
import { sendCode } from '../../service/wordpress';

export default function DeleteProfile({ navigation, route }) {

    const { theme } = useTheme()
    const { setLoading } = useGlobalState()
    const { deleteProfile, profile } = useProfile()

    const [confirm, setConfirm] = useState('')
    const [vcode, setVcode] = useState('')
    const [step, setStep] = useState(0)

    const recaptcha = useRef<RecaptchaRef>(null);

    const doSendMail = async (token) => {
        setLoading(true)
        try {
            await sendCode({ username: profile.name, code: token })
            Toast.show('验证码已发送到您的邮箱', { duration: Toast.durations.SHORT, position: Toast.positions.CENTER, shadow: true, animation: true, hideOnPress: true, delay: 0, onHidden: () => { } })
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

    const onDeleteProfile = async () => {
        if (vcode == '') {
            Toast.show('请输入验证码', { duration: Toast.durations.SHORT, position: Toast.positions.CENTER, shadow: true, animation: true, hideOnPress: true, delay: 0, onHidden: () => { } })
            return
        }
        setLoading(true)
        try {
            const res = await deleteProfile({ vcode })
            Toast.show(res.message, { duration: Toast.durations.SHORT, position: Toast.positions.CENTER, shadow: true, animation: true, hideOnPress: true, delay: 0, onHidden: () => { } })
            navigation.popToTop()
            navigation.replace('Welcome')
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
                        <Text h3 >删除账户</Text>
                    </View>
                    <View style={{ alignItems: 'center', paddingHorizontal: 0, marginTop: 40 }} >
                        {step === 0 && <Input placeholder='请在此输入"删除账户"' label='删除账户'
                            labelStyle={{ marginLeft: 16, color: theme.colors.error }}
                            errorStyle={{ height: 0 }}
                            inputContainerStyle={{ paddingHorizontal: 16, borderWidth: 0, borderBottomWidth: 0, borderRadius: 10, height: 50 }}
                            onChangeText={setConfirm} value={confirm}></Input>}
                        {step === 1 && <Input placeholder='验证码' label='正在删除账户, 请输入邮箱验证码'
                            labelStyle={{ marginLeft: 16, color: theme.colors.error }}
                            errorStyle={{ height: 0 }}
                            inputContainerStyle={{ paddingHorizontal: 16, borderWidth: 0, borderBottomWidth: 0, borderRadius: 10, height: 50 }}
                            onChangeText={setVcode} value={vcode}></Input>}
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
                        {step === 0 && <Button disabled={confirm !== '删除账户'} radius={10}
                            onPress={() => onSendMail()}>{'下一步'}</Button>}
                        {step === 1 && <Button disabled={vcode.length === 0} radius={10}
                            onPress={() => onDeleteProfile()}>{'确定'}</Button>}
                    </View>
                </View>
            </ScrollView>
        </View>
    </>
}