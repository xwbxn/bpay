import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Icon, Tab, TabView, useTheme } from '@rneui/themed';

import { GlobalContext } from '../../store/globalContext';
import PostFlatList from './components/postFlatList';

const getSubCateIds = (root, cates) => {
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
    return result.map(v => v.id)
}

export default function PostList({ route, navigation }) {

    const { theme } = useTheme()
    const screenSize = useWindowDimensions()

    const { id } = route.params
    const { categories } = useContext(GlobalContext)
    const [navItems, setNavItems] = useState([])
    // const [subNavItems, setSubNavItems] = useState([])
    const [tabIndex, setTabIndex] = useState(0)

    useEffect(() => {
        const topNavItems = categories.filter(v => v.parent === id)
        console.log('topNavItems', topNavItems.map(v => v.name))
        topNavItems.forEach(v => {
            v.title = v.name
            v.children = categories.filter(i => i.parent === v.id)
            v.categories = getSubCateIds(v, categories)
        })
        const root = categories.find(v => v.id === id)
        if (root) {
            root.title = '最新'
            root.categories = getSubCateIds(root, categories)
            topNavItems.unshift(root)
        }

        setNavItems(topNavItems)
    }, [id, categories])

    // useEffect(() => {
    //     if (navItems[tabIndex]) {
    //         setSubNavItems(navItems[tabIndex].children || [])
    //     }
    // }, [tabIndex])

    const onPostPress = useCallback((item) => {
        navigation.push('PostDetail', { id: item.id, link: item.link })
    }, [])

    const onProfilePress = useCallback(() => {
        navigation.push('Login')
    }, [])

    return <>
        <SafeAreaView style={{ flex: 1 }}>
            {/* 頂部搜索 */}
            <View style={{ flexDirection: "row", backgroundColor: theme.colors.primary, alignItems: "center", height: 50 }}>
                <View><Icon containerStyle={{ width: 50 }} iconStyle={{ fontSize: 30, color: theme.colors.background }}
                    name="user" type="font-awesome" onPress={() => { onProfilePress() }}></Icon></View>
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center' }}>
                    <Button type='clear' titleStyle={{ color: theme.colors.background, fontWeight: 'bold' }} title={"首页"}></Button>
                    <Button type='clear' titleStyle={{ color: theme.colors.background, fontWeight: 'bold' }} title={"视频"}></Button>
                    <Button type='clear' titleStyle={{ color: theme.colors.background, fontWeight: 'bold' }} title={"一对一"}></Button>
                </View>
                <View>
                    <Icon containerStyle={{ width: 50 }} iconStyle={{ fontSize: 30, color: theme.colors.background }}
                        name="search" type="font-awesome"></Icon>
                </View>
            </View>
            {/* 滚动菜单 */}
            <Tab value={tabIndex} onChange={(e) => { setTabIndex(e) }}
                scrollable dense
                style={{ backgroundColor: theme.colors.background }}
                indicatorStyle={{ backgroundColor: theme.colors.primary }}>
                {navItems.map(v =>
                    <Tab.Item key={v.id} title={v.title} titleStyle={{ color: theme.colors.black }}></Tab.Item>)}
            </Tab>
            {/* 文章列表 */}
            <View style={{ flex: 1 }}>
                <TabView value={tabIndex} onChange={(e) => { setTabIndex(e) }}>
                    {navItems.map((v, i) =>
                        <TabView.Item key={v.id}>
                            <View style={{ flex: 1 }}>
                                {/* <View style={{ backgroundColor: theme.colors.background }}>
                                    <ScrollView horizontal>
                                        {subNavItems.map(i =>
                                            <Button containerStyle={{ padding: 5 }}
                                                key={i.id} type='outline'
                                                size='sm'
                                                title={i.name}></Button >)}
                                    </ScrollView>
                                </View> */}
                                <View style={{ flex: 1 }}>
                                    {/* 文章条目 */}
                                    <PostFlatList
                                        active={i === tabIndex}
                                        onPress={onPostPress}
                                        categories={v.categories}
                                    ></PostFlatList>
                                </View>
                            </View>
                        </TabView.Item>)}
                </TabView>
            </View>
        </SafeAreaView>
    </>
}