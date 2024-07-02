import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';


import { Badge, BottomSheet, Button, Chip, Header, Icon, Input, Text, useTheme } from '@rneui/themed';

import { normalizeText } from "@freakycoder/react-native-helpers";

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import BpayHeader from '../../components/BpayHeader';
import { uploadMedia } from '../../service/wordpress';
import { useProfile } from '../../store/profileContext';
import moment from 'moment';

interface IMicroBlogProps {
    author: {
        id: string,
        name: string,
        avatar?: string,
    },
    content: string,
    images: {
        uri: string,
        width?: number,
        height?: number,
    }[],
    create_time: number | Date,
    comment_count?: number,
    favor_count?: number,
    star_count?: number
}

const RenderMicroBlog = (opts: IMicroBlogProps) => {
    const {
        author,
        content,
        images,
        create_time
    } = opts

    const { theme } = useTheme()

    const renderImages = (images) => {
        if (images.length === 1) {
            const img = images[0]
            return <View>
                <Image source={{ uri: img.uri }}
                    style={{ borderRadius: 5, height: 220, width: '50%' }}
                    contentPosition='top left'
                    contentFit='cover'></Image>
            </View>
        }
    }

    const styles = useMemo(() => {
        return StyleSheet.create({
            contaier: {
                backgroundColor: theme.colors.background
            },
            header: {
                flexDirection: 'row'
            },
            headerLeft: {

            },
            headerCenter: {
                flex: 1,
                paddingLeft: 8,
                justifyContent: 'center'
            },
            headerCenterTitle: {
                fontSize: normalizeText(12),
                fontWeight: 'bold',
            },
            headerCenterTime: {
                fontSize: normalizeText(10),
                color: theme.colors.grey0
            },
            headerRight: {
                justifyContent: 'center',
                paddingRight: 8
            },
            contentBox: {
                paddingVertical: 16
            },
            content: {
                fontSize: normalizeText(12),
                lineHeight: normalizeText(20)
            },
            imageList: {

            },
            hotComment: {

            },
            footer: {

            }
        })
    }, [theme])

    return <>
        <View style={styles.contaier}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Image source={{ uri: author.avatar }} style={{ width: normalizeText(30), height: normalizeText(30), borderRadius: 5 }} contentFit='cover'></Image>
                </View>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerCenterTitle}>{author.name}</Text>
                    <Text style={styles.headerCenterTime}>{moment(create_time).fromNow()}</Text>
                </View>
                <View style={styles.headerRight}>
                    <Chip title={'关注'} size='sm'></Chip>
                </View>
            </View>
            <View style={styles.contentBox}><Text style={styles.content}>{content}</Text></View>
            <View style={styles.imageList}>
                {renderImages(images)}
            </View>
            <View style={styles.hotComment}></View>
            <View style={styles.footer}></View>
        </View>
    </>
}


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
                <RenderMicroBlog author={
                    {
                        id: '1',
                        name: '历史风暴',
                        avatar: 'http://e.hiphotos.baidu.com/image/pic/item/4e4a20a4462309f7e41f5cfe760e0cf3d6cad6ee.jpg'
                    }}
                    content={content}
                    images={[{
                        uri: 'http://e.hiphotos.baidu.com/image/pic/item/4bed2e738bd4b31c1badd5a685d6277f9e2ff81e.jpg',
                        height: 600,
                        width: 400,
                    }]}
                    create_time={new Date()}
                />
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