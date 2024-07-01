import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';


import { Badge, BottomSheet, Button, Header, Icon, Input, Text, useTheme } from '@rneui/themed';

import PostFlatList from './components/PostFlatList';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import BpayHeader from '../../components/BpayHeader';
import { uploadMedia } from '../../service/wordpress';
import { FileSystemUploadType, uploadAsync } from 'expo-file-system';
import { useProfile } from '../../store/profileContext';


export default function SquireList({ route, navigation }) {

    const { theme } = useTheme()
    const { profile } = useProfile()
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
                setFiles([...files, a])
            })
        }
    }



    const onPublish = async () => {
        // 1. create post & get post id
        // 2. upload images with post id
        // 3. back to post viewer

        const form = new FormData()
        // @ts-ignore
        // form.append('file', { uri: a.uri, type: 'multipart/form-data', name: a.fileName })
        // uploadMedia(a.fileName, form).then(res => {
        //     console.log('res', res)
        // })
    }

    const onRemoveImage = async (item) => {
        files.splice(files.findIndex(f => f.assetId === item.assetId), 1)
        setFiles([...files])
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
                            style={{ width: "100%", height: "100%" }}></Image>
                        <Badge onPress={() => onRemoveImage(f)} value={'X'} badgeStyle={{ backgroundColor: '#555' }} containerStyle={{ position: 'absolute', top: 5, right: 5 }}></Badge>
                    </View>))}
                    <View style={[styles.imageButton, { width: (width - 40) / 3, height: (width - 40) / 3 }]}>
                        <Icon onPress={onAddImage} size={width / 6} color={theme.colors.grey4} name='plus' type='antdesign'></Icon>
                    </View>
                </View>
            </View>
        </BottomSheet>
    }, [width, showBottomSheet, content, files])

    return <>
        <View style={{ flex: 1 }}>
            <BpayHeader showback title='广场' rightComponent={<Icon onPress={onNewTopic} name='plus-circle' type='feather' color={theme.colors.background}></Icon>}></BpayHeader>
            {/* container */}
            <View style={{ flex: 1, padding: 16 }}>
                <View>
                    <Text>{content}</Text>
                    {files.map(item => {
                        return <View style={{width: item.}}> <Image source={{ uri: item.uri }}></Image></View>
                    })}
                </View>
            </View>
            {newPostSheet()}
        </View>
    </>
}

const styles = StyleSheet.create({
    contentBox: {
        paddingTop: 20,
        backgroundColor: '#f5f5f5',
        minHeight: 80
    },
    imageButton: {
        backgroundColor: '#dddddd',
        margin: 4,
        justifyContent: 'center',
        alignItems: 'center'
    }
})