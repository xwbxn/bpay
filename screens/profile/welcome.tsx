import { Avatar, useTheme, Text, Button } from '@rneui/themed';
import React from 'react';
import { useWindowDimensions } from 'react-native';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';

// 假设您已经将logo图片放在了项目的assets/images目录下
const logoSource = require('../../assets/icon.png');

export default function Welcome({ navigation }) {
    const { theme } = useTheme()
    const { width, height } = useWindowDimensions()


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
        flexDirection: 'row'
    },
    startButton: {
        width: '40%',
        marginHorizontal: 5,
    },
});