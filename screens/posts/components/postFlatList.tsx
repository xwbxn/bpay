import React, { memo, useCallback, useEffect, useState } from 'react';
import { FlatList, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import RenderHtml from 'react-native-render-html';

import { Image, Text, useTheme } from '@rneui/themed';

import { getPosts } from '../../../service/wordpress';
import moment from 'moment';

interface IProps {
    active: boolean,
    categories: number[] | string[],
    onPress?: (item: any) => void
}

const keyExtractor = (item, index) => index.toString()
const PostFlatList = (props: IProps) => {
    const { active, categories, onPress } = props
    const [page, setPage] = useState(1)
    const [data, setData] = useState([])

    const { theme } = useTheme()

    const renderItem = useCallback(({ item }) => {

        const category = item._embedded['wp:term'][0][0].name || ''

        return (
            <TouchableOpacity activeOpacity={1} onPress={() => { onPress && onPress(item) }}>
                <View key={item.id} style={{
                    marginVertical: 1, paddingHorizontal: 12,
                    paddingVertical: 8, backgroundColor: theme.colors.background
                }}
                >
                    <View style={{ flexDirection: 'row' }}>
                        <View style={{ width: "78%" }}>

                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', paddingBottom: 4 }}>{item.title.rendered}</Text>
                            </View>
                            <View style={{ paddingBottom: 2 }}>
                                <Text style={{ color: theme.colors.grey3 }}>{category} {item._embedded.author[0].name} | {moment(item.date).format("YYYY-MM-DD")}</Text>
                            </View>
                        </View>
                        <View style={{ width: "22%" }}>
                            <Image style={{ width: '100%', aspectRatio: 1.1, borderRadius: 0 }}
                                source={{ uri: item._embedded['wp:featuredmedia'][0].media_details.sizes.thumbnail.source_url }}></Image>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>)
    }, [])

    const refreshData = () => {
        getPosts({
            categories: categories.join(',') || ' ',
            page: 1,
            per_page: 10
        }).then(res => {
            setData(res)
            setPage(1)
        })
    }

    const loadMoreData = () => {
        getPosts({
            categories: categories.join(',') || ' ',
            page: page + 1,
            per_page: 10
        }).then(res => {
            const moreData = data.concat(res)
            console.log('moreData.length', moreData.length)
            setData(moreData)
            setPage(page + 1)
        }).catch(res => {
            if (res.response && res.response.status === 400) {
                console.log('no more')
            }
        })
    }

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