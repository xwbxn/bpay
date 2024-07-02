import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions, FlatList, TouchableOpacity, Alert } from 'react-native';


import { Badge, BottomSheet, Button, Header, Icon, Input, useTheme } from '@rneui/themed';


import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import BpayHeader from '../../components/BpayHeader';
import { createMBlog, getMBlogs, updateMBlog, uploadMedia } from '../../service/wordpress';
import { useProfile } from '../../store/profileContext';
import MicroBlog, { IMicroBlogProps } from './components/MicroBlog';
import { useGlobalState } from '../../store/globalContext';
// import ImagePicker from '../../components/ImagePicker';
import * as ImagePicker from 'expo-image-picker'
import Toast from 'react-native-root-toast';

export default function SquireList({ route, navigation }) {

    const { theme } = useTheme()
    const { profile } = useProfile()
    const [content, setContent] = useState('')
    const [isPreview, setIsPreview] = useState(false)
    const [images, setImages] = useState([])
    const [showBottomSheet, setShowBottomSheet] = useState(false)
    const { height, width } = useWindowDimensions()
    const { setLoading } = useGlobalState()
    const inset = useSafeAreaInsets()
    const [data, setdata] = useState([])
    const [page, setPage] = useState(1)
    const refreshData = () => {
        getMBlogs({
            page: 1,
            per_page: 10
        }).then(res => {
            const blogs = res.map(item => {
                return {
                    author: {
                        id: item._embedded.author[0].id,
                        name: item._embedded.author[0].name,
                        avatar: item._embedded.author[0].avatar_urls['48']
                    },
                    content: item.excerpt.rendered.replace('<p>', '').replace('</p>', '').trimEnd(),
                    images: item.images.filter(i => i !== "").map(i => (JSON.parse(i))),
                    publishTime: item.date,
                    // hotComment: { name: '红茶', content: '谁说不是呢，这真实一个问题' }
                }
            })
            setPage(1)
            setdata(blogs)
        })
    }

    useEffect(() => {
        refreshData()
    }, [])


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
            setImages([...images, ...picker.assets])
        }
    }

    const onPublish = async () => {
        // 1. create post & get post id
        try {
            setLoading(true)
            const { id } = await createMBlog({
                status: 'draft',
                content: content,
            })
            const uploaded = []
            for (const img of images) {
                const form = new FormData()
                // @ts-ignore
                form.append('file', { uri: img.uri, type: 'multipart/form-data', name: img.fileName })
                form.append('post', id)
                const { source_url } = await uploadMedia(img.fileName, form)
                uploaded.push({ uri: source_url, height: img.height, width: img.width })
            }
            await updateMBlog(id, {
                status: 'publish',
                images: uploaded.map(i => JSON.stringify(i))
            })
            Toast.show('发布成功', { position: Toast.positions.CENTER })
            setContent('')
            setImages([])
            setShowBottomSheet(false)
        } catch (error) {
            console.log('error', error)
        } finally {
            setLoading(false)
        }
    }

    const onRemoveImage = async (item) => {
        images.splice(images.findIndex(f => f.assetId === item.assetId), 1)
        setImages([...images])
    }

    const onPreview = async () => {
        setIsPreview(!isPreview)
    }

    const newPostSheet = useCallback(() => {
        return <BottomSheet isVisible={showBottomSheet} containerStyle={{ backgroundColor: 'transparent' }}
            onBackdropPress={() => setShowBottomSheet(false)}>
            <View style={{ height: height - inset.top, backgroundColor: '#f5f5f5' }}>
                <Header
                    leftComponent={<Button onPress={() => setShowBottomSheet(false)} size='sm' title={'取消'} type='clear' titleStyle={{ color: theme.colors.background }}></Button>}
                    rightComponent={
                        <View style={{ flexDirection: 'row' }}>
                            <Button onPress={onPreview} size='sm' title={isPreview ? '编辑' : '预览'} type='clear' titleStyle={{ color: theme.colors.background }}></Button>
                            <Button onPress={onPublish} size='sm' title={'发布'} type='clear' titleStyle={{ color: theme.colors.background }}></Button>
                        </View>
                    }>
                </Header>
                {!isPreview && <View style={{ backgroundColor: theme.colors.background, paddingBottom: 16 }}><Input multiline
                    value={content}
                    onChangeText={setContent}
                    textAlignVertical='top'
                    numberOfLines={3}
                    inputContainerStyle={{ borderBottomWidth: 0 }}
                    placeholder='说点什么吧'
                    style={styles.contentBox}></Input>
                    <View style={{ flexDirection: 'row', paddingHorizontal: 8, flexWrap: 'wrap' }}>
                        {images.map((f, index) => (<View key={index}
                            style={[styles.imageButton, { width: (width - 40) / 3, height: (width - 40) / 3 }]}>
                            <Image source={{ uri: f.uri }}
                                style={{ width: "100%", height: "100%" }}></Image>
                            <Badge onPress={() => onRemoveImage(f)} value={'X'}
                                badgeStyle={{ backgroundColor: '#555' }}
                                containerStyle={{ position: 'absolute', top: 5, right: 5 }}></Badge>
                        </View>))}
                        <TouchableOpacity onPress={onAddImage} style={[styles.imageButton, { width: (width - 40) / 3, height: (width - 40) / 3 }]}>
                            <Icon size={width / 6} color={theme.colors.grey4} name='plus' type='antdesign'></Icon>
                        </TouchableOpacity>
                    </View></View>}
                {isPreview && <MicroBlog
                    author={{ id: profile.name, name: profile.name, avatar: profile.avatar }}
                    content={content}
                    images={images}
                    publishTime={new Date()}
                ></MicroBlog>}
            </View>
        </BottomSheet>
    }, [width, showBottomSheet, content, images, isPreview])

    const renderItem = ({ item }) => {
        return <MicroBlog
            {...item}
        ></MicroBlog>
    }

    // const data: IMicroBlogProps[] = [
    //     {
    //         author: {
    //             id: '1',
    //             name: '历史风暴',
    //             avatar: 'http://e.hiphotos.baidu.com/image/pic/item/4e4a20a4462309f7e41f5cfe760e0cf3d6cad6ee.jpg'
    //         },
    //         content: '表弟是某211大学毕业，学的文科管理专业，毕业以后问我求职找工作的事，我给他推荐了一些还不错的工作，没想到他眼高手低根本看不上，后面他甚至拉黑了我的微信，真的是不识好人心，话说现在的年轻人都这么不能吃苦了吗',
    //         images: [{
    //             uri: 'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg',
    //         },
    //         {
    //             uri: 'http://e.hiphotos.baidu.com/image/pic/item/4bed2e738bd4b31c1badd5a685d6277f9e2ff81e.jpg',
    //         },
    //         {
    //             uri: 'https://upload-images.jianshu.io/upload_images/5809200-caf66b935fd00e18.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240',
    //         },
    //         {
    //             uri: 'https://upload-images.jianshu.io/upload_images/5809200-c12521fbde6c705b.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240',
    //         }],
    //         publishTime: new Date(),
    //         hotComment: { name: '红茶', content: '谁说不是呢，这真实一个问题' }
    //     },
    //     {
    //         author: {
    //             id: '1',
    //             name: '历史风暴',
    //             avatar: 'http://e.hiphotos.baidu.com/image/pic/item/4e4a20a4462309f7e41f5cfe760e0cf3d6cad6ee.jpg'
    //         },
    //         content: '表弟是某211大学毕业，学的文科管理专业，毕业以后问我求职找工作的事，我给他推荐了一些还不错的工作，没想到他眼高手低根本看不上，后面他甚至拉黑了我的微信，真的是不识好人心，话说现在的年轻人都这么不能吃苦了吗',
    //         images: [{
    //             uri: 'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg',
    //         },
    //         {
    //             uri: 'http://e.hiphotos.baidu.com/image/pic/item/4bed2e738bd4b31c1badd5a685d6277f9e2ff81e.jpg',
    //         },
    //         {
    //             uri: 'https://upload-images.jianshu.io/upload_images/5809200-caf66b935fd00e18.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240',
    //         },
    //         {
    //             uri: 'https://upload-images.jianshu.io/upload_images/5809200-c12521fbde6c705b.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240',
    //         }],
    //         publishTime: new Date(),
    //         hotComment: { name: '红茶', content: '谁说不是呢，这真实一个问题' }
    //     }
    // ]

    return <>
        <View style={{ flex: 1 }}>
            <BpayHeader showback title='广场' rightComponent={<Icon onPress={onNewTopic} name='plus-circle' type='feather' color={theme.colors.background}></Icon>}></BpayHeader>
            {/* container */}
            <View style={{ flex: 1 }}>
                <FlatList renderItem={renderItem}
                    data={data}>
                </FlatList>
            </View>
            {newPostSheet()}
        </View>
    </>
}

const styles = StyleSheet.create({
    contentBox: {
        paddingTop: 20,
        minHeight: 80,
        lineHeight: 28
    },
    imageButton: {
        backgroundColor: '#dddddd',
        margin: 4,
        justifyContent: 'center',
        alignItems: 'center'
    }
})