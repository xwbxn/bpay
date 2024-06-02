import * as Clipboard from 'expo-clipboard';

import { View, StyleSheet, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import BpayHeader from '../../components/BpayHeader'
import { Button, Text } from '@rneui/themed'
import { useProfile } from '../../store/profileContext'
import { useGlobalState } from '../../store/globalContext'
import Toast from 'react-native-root-toast'

const DebugInfo = () => {

    const { profile } = useProfile()
    const { categories, membershipLevels } = useGlobalState()
    const [message, setMessage] = useState('')

    useEffect(() => {
        setMessage(JSON.stringify({
            categories, membershipLevels, profile
        }))
    }, [categories, membershipLevels, profile])


    return (
        <View style={styles.container}>
            <BpayHeader title='调试信息' showback />
            <ScrollView style={styles.debugInfo}>
                <Text>{message}</Text>
            </ScrollView>
            <Button onPress={() => {
                Clipboard.setStringAsync(message).then(() => {
                    Toast.show('已复制', { position: Toast.positions.CENTER })
                })
            }}>复制</Button>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    debugInfo: {
        flex: 1,
    }
})

export default DebugInfo