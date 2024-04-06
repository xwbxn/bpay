import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, Image, Tab, TabView, useTheme } from '@rneui/themed';

import { useGlobalState, useProfile } from '../../store/globalContext';
import PostFlatList from './components/PostFlatList';
import PostHeader from './components/PostHeader';

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
    const { id } = route.params
    const { categories } = useGlobalState()
    const [navItems, setNavItems] = useState([])
    const [tabIndex, setTabIndex] = useState(0)
    const profile = useProfile((state: any) => state.profile)


    const styles = StyleSheet.create({
        headTitle: {
            color: theme.colors.background,
            fontWeight: 'bold',
            marginHorizontal: 8
        }
    })

    // 导航条样式
    useEffect(() => {
        // set nav bar
        navigation.getParent().setOptions({
            headerShown: false,
            headerLeft: () => <Icon iconStyle={{ fontSize: 30, color: theme.colors.background }}
                onPress={() => { onLoginPress() }}
                name="user" type="font-awesome" ></Icon>
        })
    }, [])

    useEffect(() => {
        const topNavItems = categories.filter(v => v.parent === id)
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

    const onPostPress = (item) => {
        navigation.push('PostDetail', { id: item.id, link: item.link })
    }

    const onLoginPress = () => {
        navigation.push('Login')
    }

    return <>
        <View style={{ flex: 1 }}>
            <PostHeader leftComponent={profile.authenticated
                ? <Image style={{ width: 24, aspectRatio: 1, borderRadius: 12, marginLeft: 4 }}
                    source={{ uri: profile.avatar }}></Image>
                : <Icon iconStyle={{ color: theme.colors.background }}
                    name="user" type="font-awesome" onPress={() => { onLoginPress() }}></Icon>}></PostHeader>
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
        </View>
    </>
}
