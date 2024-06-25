import { Avatar, useTheme, Text, Button } from '@rneui/themed';
import React, { useState } from 'react';
import { Alert, Pressable, useWindowDimensions } from 'react-native';
import { View, StyleSheet } from 'react-native';
import { useGlobalState } from '../../store/globalContext';

// 假设您已经将logo图片放在了项目的assets/images目录下
const logoSource = require('../../assets/icon.png');

async function fetchWithTimeout(resource, options = { timeout: 5000 }) {
    const { timeout = 5000 } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);
    return response;
}


export default function Welcome({ navigation }) {
    const { theme } = useTheme()
    const { width, height } = useWindowDimensions()
    const { setLoading } = useGlobalState()

    const testNetwork = async () => {
        setLoading(true)
        try {
            await fetchWithTimeout("https://www.b-pay.life/html/privacy_policy.html")
        } catch (e) {
            Alert.alert("认证服务连接错误", e.toString())
            setLoading(false)
            return false
        }

        try {
            await fetchWithTimeout("https://chat.b-pay.life")
        } catch (e) {
            Alert.alert("聊天服务连接错误", e.toString())
            setLoading(false)
            return false
        }
        setLoading(false)
        Alert.alert("网络服务测试通过")
    }

    return (
        <View style={styles.container}>
            {/* Logo 显示 */}
            <View style={styles.logo}>
                <Avatar
                    source={logoSource}
                    rounded
                    size={width * 0.4}
                />
                <Text style={styles.title}>BPay</Text>
                <Text style={styles.subtitle}>懂币，更懂你</Text>
            </View>

            {/* "开始" 按钮 */}
            <View style={styles.buttonGroup}>
                <Button containerStyle={styles.startButton} type='outline' onPress={() => navigation.navigate('Login')}>
                    登录
                </Button>
                <Button containerStyle={styles.startButton} onPress={() => navigation.navigate('Register')}>
                    新用户
                </Button>
            </View>
            <View style={styles.bottom}>
                <Pressable onPress={testNetwork}>
                    <Text style={{ color: theme.colors.primary }}>运行环境检测</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-around',
        alignItems: 'center'
    },
    logo: {
        marginBottom: 60, // 在按钮前添加一些间距
        alignItems: 'center'
    },
    title: {
        fontSize: 26,
        paddingTop: 20,
        paddingBottom: 10
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    buttonGroup: {
        flexDirection: 'row',
    },
    startButton: {
        width: '40%',
        marginHorizontal: 5,
    },
    bottom: {
        position: 'absolute',
        bottom: 20,
    }
});