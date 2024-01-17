import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@rneui/themed';

export default function PostList({ route, navigation }) {

    const { category } = route.params

    useEffect(() => {
        navigation.setOptions({
            headerShown: false
        })
    }, [])

    return <>
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
                <Text onPress={() => {
                    navigation.push('PostDetail', { id: 1 })
                }}>{category}</Text>
            </View>
        </SafeAreaView>
    </>
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }
})