import { Avatar, useTheme, Text } from '@rneui/themed'
import React from 'react'
import { useWindowDimensions } from 'react-native'
import { View, StyleSheet } from 'react-native'
import { useMatrixClient } from '../../store/useMatrixClient'

export const MemberProfile = ({ navigation, route }) => {

    const { theme } = useTheme()
    const { userId } = route.params
    const { client } = useMatrixClient()
    const { width, height } = useWindowDimensions()
    const user = client.getUser(userId)

    console.log('user', user)

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Avatar title={user.displayName[0]} size={width / 3} rounded
                    containerStyle={{
                        backgroundColor: theme.colors.primary,
                        marginBottom: 20,
                        marginTop: 40
                    }}></Avatar>
                <Text h4>{user.userId}</Text>
            </View>
        </View >
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { backgroundColor: '#ffffff', flex: 1, alignItems: 'center' },
})