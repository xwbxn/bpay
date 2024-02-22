import { useNavigation } from '@react-navigation/native'
import { Icon } from '@rneui/themed'
import React from 'react'
import { View, Text } from 'react-native'

export function NavBar() {

    const navigation = useNavigation()

    return (
        <View
            style={{
                alignItems: 'center',
                height: 50,
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 10
            }}
        >
            <Icon name="chevron-back" size={30} type='ionicon' onPress={() => {
                navigation.goBack()
            }}></Icon>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>D.T 亚军</Text>
            <Text style={{ fontSize: 18 }}>···</Text>
        </View>
    )
}