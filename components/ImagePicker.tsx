import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import React, { useEffect, useState } from 'react'
import * as MediaLibrary from 'expo-media-library';
import { Image } from 'expo-image';
import { Header, Icon } from '@rneui/themed';

const ImagePicker = () => {

    const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
    const [data, setData] = useState([{ uri: 'tool' }])
    const [hasNext, setHasNext] = useState(false)
    const { width } = useWindowDimensions()

    const loadMore = async () => {
        await requestPermission();
        const { assets, hasNextPage } = await MediaLibrary.getAssetsAsync();
        setHasNext(hasNextPage)
        setData([...data, ...assets])
    }

    useEffect(() => {
        loadMore()
    }, [])


    const renderItem = ({ item }: { item: any }) => {
        if (item.uri === 'tool') {
            return <View style={{
                height: width / 3, width: width / 3, borderWidth: 1,
                borderColor: '#eee', justifyContent: 'center', alignItems: 'center'
            }}>
                <Icon name='camera' type='antdesign' size={50} color={'#aaa'}></Icon>
                <Text>拍摄</Text>
            </View>
        }
        return <Image source={{ uri: item.uri }} style={{ height: width / 3, width: width / 3 }}></Image>
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable><Text>取消</Text></Pressable>
                <Pressable><Text>确定</Text></Pressable>

            </View>
            <View>
                <FlatList
                    numColumns={3}
                    data={data} renderItem={renderItem}></FlatList>
            </View>
        </View>
    )
}

export default ImagePicker

const styles = StyleSheet.create({
    container: {},
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 40
    },
    headerText: {
        color: 'red'
    },
    imageList: {
        flexDirection: 'row',
        // flexWrap: 'wrap'
    }
})