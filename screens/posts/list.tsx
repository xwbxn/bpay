import { useCallback, useContext, useEffect, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Icon, SearchBar, Tab, TabView, Text, useTheme } from '@rneui/themed';
import RenderHtml from 'react-native-render-html';

import { getPosts } from '../../service/wordpress';
import { GlobalContext } from '../../store/globalContext';

const getSubCates = (root, cates) => {
    const result = []
    const stack = [root]
    while (stack.length > 0) {
        const cate = stack.pop()
        result.push(cate)
        const subs = cates.filter(v => v.parent === cate.id)
        subs.forEach(v => {
            stack.push(v)
        });
    }
    return result
}

const keyExtractor = (item, index) => index.toString()

export default function PostList({ route, navigation }) {

    const { theme } = useTheme()
    const screenSize = useWindowDimensions()

    const { id } = route.params
    const { categories } = useContext(GlobalContext)
    const [navItems, setNavItems] = useState([])
    const [subNavItems, setSubNavItems] = useState([])
    const [filter, setFilter] = useState({ categories: [] })
    const [posts, setPosts] = useState({})

    const [index, setIndex] = useState(0)

    const renderItem = useCallback(({ item }) => {
        return <View key={item.id}>
            <Text>{item.title.rendered}</Text>
            <RenderHtml source={{ html: item.excerpt.rendered }} contentWidth={screenSize.width}></RenderHtml>
        </View>
    }, [screenSize])

    useEffect(() => {
        const topNavItems = categories.filter(v => v.parent === id)
        topNavItems.forEach(v => {
            v.title = v.name
            v.children = categories.filter(i => i.parent === v.id)
        })
        const root = categories.find(v => v.id === id)
        if (root) {
            root.title = '最新'
            topNavItems.unshift(root)
            setNavItems(topNavItems)
            setFilter({
                categories: getSubCates(root, categories).map(v => v.id)
            })
        }
    }, [id, categories])

    useEffect(() => {
        if (navItems[index]) {
            setSubNavItems(navItems[index].children || [])
            setFilter({
                categories: getSubCates(navItems[index], categories).map(v => v.id)
            })
        }
    }, [index])

    useEffect(() => {
        console.log('object', Object.keys(posts))
        if (filter.categories.length > 0) {
            getPosts({
                categories: filter.categories.join(',')
            }).then(res => {
                posts[index] = res
                setPosts({
                    ...posts,
                })
            })
        }
    }, [filter])


    return <>
        <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", backgroundColor: theme.colors.primary, alignItems: "center", height: 60 }}>
                <Icon containerStyle={{ width: 50 }} iconStyle={{ fontSize: 30, color: theme.colors.background }}
                    name="user" type="font-awesome"></Icon>
                <SearchBar round
                    containerStyle={{
                        backgroundColor: theme.colors.primary,
                        borderTopColor: theme.colors.primary, borderBottomWidth: 0
                    }}
                    inputContainerStyle={{ height: 40, backgroundColor: theme.colors.background, width: screenSize.width - 70 }}
                    showCancel lightTheme>
                </SearchBar>
            </View>
            <Tab value={index} onChange={(e) => { setIndex(e) }} scrollable dense indicatorStyle={{ backgroundColor: theme.colors.primary }}>
                {navItems.map(v =>
                    <Tab.Item key={v.id} title={v.title} titleStyle={{ color: theme.colors.black }}></Tab.Item>)}
            </Tab>
            <View style={{ flex: 1 }}>
                <TabView value={index} onChange={(e) => { setIndex(e) }}>
                    {navItems.map(v =>
                        <TabView.Item key={v.id}>
                            <View style={{ flex: 1 }}>
                                <View>
                                    <ScrollView horizontal>
                                        {subNavItems.map(i =>
                                            <Button containerStyle={{ padding: 5 }} key={i.id} type='outline' title={i.name}></Button >)}
                                    </ScrollView>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <FlatList data={posts[index] || []} renderItem={renderItem} keyExtractor={keyExtractor}>
                                    </FlatList>
                                </View>
                            </View>
                        </TabView.Item>)}
                </TabView>
            </View>
        </SafeAreaView>
    </>
}
