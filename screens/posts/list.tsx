import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Tab, TabView, Button, Icon, Text } from '@rneui/themed';
import { useContext, useEffect, useState } from 'react';
import { SearchBar } from '@rneui/themed';
import { useTheme } from '@rneui/themed';
import { getPosts } from '../../service/wordpress';
import { GlobalContext } from '../../store/globalContext';

const getSubCates = (id, cates) => {
    const data = [...cates]
    const result = []
    const subs = data.filter(v => v.parent === id)
    subs.forEach(v => {
        result.push(v)
    });
}

export default function PostList({ route, navigation }) {

    const { theme } = useTheme()
    const screenSize = useWindowDimensions()

    const { id } = route.params
    const { categories } = useContext(GlobalContext)
    const [currentCate, setCurrentCate] = useState([])
    const [currentSubCate, setCurrentSubCate] = useState([])
    const [filter, setFilter] = useState({ categories: [] })
    const [posts, setPosts] = useState([])

    const [index, setIndex] = useState(0)

    useEffect(() => {
        const data = categories.filter(v => v.parent === id)
        data.forEach(v => {
            v.title = v.name
            v.children = categories.filter(i => i.parent === v.id)
        })
        const root = categories.find(v => v.id === id)
        if (root) {
            root.title = '全部'
            data.unshift(root)
            setCurrentCate(data)
            setFilter({
                categories: [id]
            })
        }
    }, [id, categories])

    useEffect(() => {
        if (currentCate[index]) {
            setCurrentSubCate(currentCate[index].children || [])
        }
    }, [index])

    useEffect(() => {
        if (filter.categories.length > 0) {
            getPosts({
                categories: filter.categories.join(',')
            }).then(res => {
                setPosts(res)
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
                {currentCate.map(v =>
                    <Tab.Item key={v.id} title={v.title} titleStyle={{ color: theme.colors.black }}></Tab.Item>)}
            </Tab>
            <TabView containerStyle={{ flex: 1 }} value={index} onChange={(e) => { setIndex(e) }}>
                {currentCate.map(v =>
                    <TabView.Item key={v.id} >
                        <View>
                            <ScrollView horizontal>
                                {currentSubCate.map(i =>
                                    <Button containerStyle={{ padding: 5 }} key={i.id} type='outline' title={i.name}></Button >)}
                            </ScrollView>
                            <View style={{ flex: 1, backgroundColor: 'red', height: 500 }}>
                                {posts.map(p => <Text key={p.id}>{p.name}</Text>)}
                            </View>
                            <View>
                                <Text>bottom {posts.length}</Text>
                            </View>
                        </View>
                    </TabView.Item>)}
            </TabView>
        </SafeAreaView>
    </>
}
