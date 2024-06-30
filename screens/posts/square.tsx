import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';


import { BottomSheet, Button, Header, Icon, Input, useTheme } from '@rneui/themed';

import PostFlatList from './components/PostFlatList';
import PostHeader from './components/PostHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';


export default function SquireList({ route, navigation }) {

    const { theme } = useTheme()
    const [content, setContent] = useState('')
    const [files, setFiles] = useState([])
    const [showBottomSheet, setShowBottomSheet] = useState(false)
    const { height, width } = useWindowDimensions()
    const inset = useSafeAreaInsets()

    // 广场类型文章的id
    const id = '224'

    const onPostPress = (item) => {
        navigation.push('PostDetail', { id: item.id, link: item.link })
    }

    const onNewTopic = () => {
        setShowBottomSheet(true)
    }

    const onAddImage = async () => {
        const picker = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            aspect: [4, 3],
            quality: 1,
            allowsMultipleSelection: true,
            selectionLimit: 9
        })
        if (!picker.canceled) {
            picker.assets.forEach(async (a) => {
                console.log('a', a)
                setFiles([...files, a])
            })
        }
    }

    const onPreview = async () => {
        console.log('content', content)
        console.log('files.', files.map(f => f.uri))
    }

    const newPostSheet = useCallback(() => {
        return <BottomSheet isVisible={showBottomSheet} containerStyle={{ backgroundColor: 'transparent' }}
            onBackdropPress={() => setShowBottomSheet(false)}>
            <View style={{ height: height - inset.top, backgroundColor: '#f5f5f5' }}>
                <Header
                    leftComponent={<Button onPress={() => setShowBottomSheet(false)} size='sm' title={'取消'} type='clear' titleStyle={{ color: theme.colors.background }}></Button>}
                    rightComponent={
                        <View style={{ flexDirection: 'row' }}>
                            <Button onPress={onPreview} size='sm' title={'预览'} type='clear' titleStyle={{ color: theme.colors.background }}></Button>
                            <Button size='sm' title={'发布'} type='clear' titleStyle={{ color: theme.colors.background }}></Button>
                        </View>
                    }>
                </Header>
                <Input multiline
                    value={content}
                    onChangeText={setContent}
                    textAlignVertical='top'
                    numberOfLines={10}
                    inputContainerStyle={{ borderBottomWidth: 0 }}
                    placeholder='说点什么吧'
                    style={styles.contentBox}></Input>
                <View style={{ flexDirection: 'row', paddingHorizontal: 8, flexWrap: 'wrap' }}>
                    {files.map((f, index) => (<View key={index}
                        style={[styles.imageButton, { width: (width - 40) / 3, height: (width - 40) / 3 }]}>
                        <Image source={{ uri: f.uri }}
                            style={{ width: "100%", height: "100%" }}></Image></View>))}
                    <View style={[styles.imageButton, { width: (width - 40) / 3, height: (width - 40) / 3 }]}>
                        <Icon onPress={onAddImage} size={width / 6} color={theme.colors.grey4} name='plus' type='antdesign'></Icon>
                    </View>
                </View>
            </View>
        </BottomSheet>
    }, [width, showBottomSheet, content, files])

    return <>
        <View style={{ flex: 1 }}>
            <PostHeader showback rightComponent={<Icon onPress={onNewTopic} name='plus-circle' type='feather' color={theme.colors.background}></Icon>}></PostHeader>
            {/* 文章列表 */}
            <View style={{ flex: 1 }}>
                {/* 文章条目 */}
                <PostFlatList
                    active
                    onPress={onPostPress}
                    categories={[id]}
                ></PostFlatList>
            </View>
            {newPostSheet()}
        </View>
    </>
}

const styles = StyleSheet.create({
    contentBox: {
        paddingTop: 20,
        backgroundColor: '#f5f5f5',
        minHeight: 120
    },
    imageButton: {
        backgroundColor: '#dddddd',
        margin: 4,
        justifyContent: 'center',
        alignItems: 'center'
    }
})