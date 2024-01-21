import React, { memo, useCallback, useEffect, useState } from 'react';
import { FlatList, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import RenderHtml from 'react-native-render-html';

import { Image, Skeleton, Text, useTheme } from '@rneui/themed';

import { getPosts } from '../../../service/wordpress';

interface IProps {
    active: boolean,
    categories: number[] | string[],
    onPress?: (item: any) => void
}

const keyExtractor = (item, index) => index.toString()
const PostFlatList = (props: IProps) => {
    console.log('props', props)
    const { active, categories, onPress } = props
    const [page, setPage] = useState(1)
    const [data, setData] = useState([])

    const { theme } = useTheme()
    const screenSize = useWindowDimensions()

    const renderItem = useCallback(({ item }) => {
        return (
            <TouchableOpacity activeOpacity={1} onPress={() => { onPress && onPress(item) }}>
                <View key={item.id} style={{
                    marginVertical: 4, paddingHorizontal: 8,
                    paddingVertical: 4, backgroundColor: theme.colors.background
                }}
                >
                    <Text style={{ fontSize: 18, fontWeight: 'bold', paddingBottom: 4 }}>{item.title.rendered}</Text>
                    <View style={{ flexDirection: 'row' }}>
                        <View style={{ width: "66%" }}>
                            <View style={{ paddingBottom: 2, flexDirection: 'row' }}>
                                {item._embedded.author[0].avatar_urls['24'] &&
                                    <Image style={{ width: 20, height: 20, borderRadius: 10, marginRight: 8 }}
                                        source={{ uri: item._embedded.author[0].avatar_urls['24'] }}
                                        PlaceholderContent={<Skeleton circle width={20} height={20} />}></Image>}
                                <Text>{item._embedded.author[0].name}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <View>
                                    <RenderHtml tagsStyles={{ p: { margin: 0 } }}
                                        source={{ html: item.excerpt.rendered }} contentWidth={screenSize.width}></RenderHtml>
                                </View>
                            </View>
                            <View style={{ paddingBottom: 2 }}>
                                <Text style={{ fontSize: 12, color: theme.colors.grey0 }}>收藏 评论</Text>
                            </View>
                        </View>
                        <View style={{ width: screenSize.width / 3 }}>
                            <Image style={{ width: '100%', aspectRatio: 1.1, borderRadius: 10 }}
                                source={{ uri: item._embedded['wp:featuredmedia'][0].media_details.sizes.thumbnail.source_url }}></Image>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>)
    }, [])

    const refreshData = useCallback(() => {
        getPosts({
            categories: categories.join(','),
            page: 1,
            per_page: 10
        }).then(res => {
            setData(res)
            setPage(1)
        })
    }, [])

    const loadMoreData = useCallback(() => {
        getPosts({
            categories: categories.join(','),
            page: page + 1,
            per_page: 10
        }).then(res => {
            setData(data.concat(res))
            setPage(page + 1)
        }).catch(res => {
            if (res.response && res.response.status === 400) {
                console.log('no more')
            }
        })
    }, [])

    useEffect(() => {
        if (active && data.length === 0) {
            refreshData()
        }
    }, [active])

    return <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshing={false}
        onEndReached={() => {
            loadMoreData()
        }}
        onRefresh={() => {
            refreshData()
        }}
    />
}

export default memo(PostFlatList, (prev, next) => {
    return prev.active === next.active && prev.categories.join(',') === next.categories.join(',')
})