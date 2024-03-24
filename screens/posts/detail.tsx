import { Audio, ResizeMode, Video } from 'expo-av';
import VideoPlayer from 'expo-video-player';
import React, { useEffect, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import RenderHtml, {
    CustomBlockRenderer, HTMLContentModel, HTMLElementModel, useComputeMaxWidthForTag,
    useContentWidth
} from 'react-native-render-html';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Icon, Text, useTheme } from '@rneui/themed';

// import VideoPlayer from 'expo-fullscreen-video-player';
import Searchbar from '../../components/searchbar';
import { getPost } from '../../service/wordpress';
import { useGlobalState } from '../../store/globalContext';

const customElementModels = {
    video: HTMLElementModel.fromCustomModel({
        contentModel: HTMLContentModel.block,
        tagName: "video",
        isOpaque: true,
    }),
    audio: HTMLElementModel.fromCustomModel({
        contentModel: HTMLContentModel.block,
        tagName: "audio",
        isOpaque: true,
    }),
};

const AudioRenderer: CustomBlockRenderer = ({
    tnode,
    style,
}) => {
    const width = useWindowDimensions().width;
    return (
        <VideoPlayer
            videoProps={{
                resizeMode: ResizeMode.CONTAIN,
                source: { uri: tnode.attributes.src },
                useNativeControls: true
            }}
            style={{
                ...style,
                width: width,
                height: 100,
            }}
        />
    );
};

const VideoRenderer: CustomBlockRenderer = ({
    tnode,
    style,
}) => {
    const width = useWindowDimensions().width;
    return (
        <VideoPlayer
            videoProps={{
                resizeMode: ResizeMode.CONTAIN,
                source: { uri: tnode.attributes.src },
                useNativeControls: true
            }}
            style={{
                ...style,
                width: width,
                height: width / (16 / 9),
            }}
        />
    );
};

export default function PostDetail({ route, navigation }) {

    const { id, link } = route.params
    const { theme } = useTheme()
    const screenSize = useWindowDimensions()
    const [content, setContent] = useState('')
    const { setLoading } = useGlobalState()

    useEffect(() => {
        setLoading(true)
        getPost(id).then(res => {
            setContent(res.content.rendered)
        }).finally(() => {
            setLoading(false)
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
            <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <ScrollView>
                    <RenderHtml ignoredDomTags={['button']}
                        debug
                        baseStyle={{ padding: 8 }}
                        tagsStyles={{ figure: { margin: 0 } }}
                        customHTMLElementModels={customElementModels}
                        renderers={{ video: VideoRenderer, audio: AudioRenderer }}
                        contentWidth={screenSize.width}
                        source={{ html: content }}></RenderHtml>
                </ScrollView>
            </View>
        </SafeAreaView></>
}