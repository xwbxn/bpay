import React, { useEffect, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { Button, Icon, Text, useTheme } from '@rneui/themed';

import Searchbar from '../../components/searchbar';
import { getPost } from '../../service/wordpress';

export default function PostDetail({ route, navigation }) {

    const { id, link } = route.params

    const { theme } = useTheme()
    const screenSize = useWindowDimensions()

    const [content, setContent] = useState('')

    useEffect(() => {
        getPost(id).then(res => {
            setContent(res.content.rendered)
        })
    }, [id])

    return <>
        <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", backgroundColor: theme.colors.primary, alignItems: "center", height: 60 }}>
                <Button containerStyle={{ width: 50 }} onPress={() => navigation.goBack()}>
                    <Icon containerStyle={{ width: 50 }} iconStyle={{ fontSize: 30, color: theme.colors.background }}
                        name="arrow-circle-left" type="font-awesome"></Icon>
                </Button>
                <Searchbar width={screenSize.width - 70} />
            </View>
            <View style={{ flex: 1 }}>
                <WebView style={{ width: '100%' }} source={{ uri: link }}></WebView>
            </View>
        </SafeAreaView></>
}