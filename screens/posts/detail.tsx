import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@rneui/themed';

export default function PostDetail({ route, navigation }) {

    const { id } = route.params

    return <>
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
                <Text>content id: {id}</Text>
            </View>
        </SafeAreaView></>
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }
})