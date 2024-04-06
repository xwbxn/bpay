import { Image } from 'expo-image';
import moment from 'moment';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { FlatList, TouchableOpacity, useWindowDimensions } from 'react-native';

import { ListItem, useTheme } from '@rneui/themed';

import { getPosts } from '../../../service/wordpress';

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
    const { width } = useWindowDimensions()

    const { theme } = useTheme()

    const renderItem = useCallback(({ item }) => {

        const category = item._embedded['wp:term'][0][0].name || ''
        return (
            <TouchableOpacity activeOpacity={1} onPress={() => { onPress && onPress(item) }}>
                <ListItem containerStyle={{ width, paddingTop: 4, paddingBottom: 4 }} bottomDivider>
                    <ListItem.Content style={{ justifyContent: 'space-between', minHeight: 64 }}>
                        <ListItem.Title style={{ fontWeight: 'bold' }} numberOfLines={2} lineBreakMode='clip'>{item.title.rendered}</ListItem.Title>
                        <ListItem.Subtitle style={{ color: theme.colors.grey3 }}>{category} {item._embedded.author[0].name} | {moment(item.date).format("YYYY-MM-DD")}</ListItem.Subtitle>
                    </ListItem.Content>
                    <Image style={{ width: 80, aspectRatio: 1.1, borderRadius: 0 }}
                        source={{ uri: item._embedded['wp:featuredmedia'][0].media_details.sizes.thumbnail.source_url }}></Image>
                </ListItem>
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