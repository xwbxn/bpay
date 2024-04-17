import { ResizeMode } from 'expo-av';
import * as Sharing from 'expo-sharing';
import VideoPlayer from 'expo-video-player';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import RenderHtml, {
    CustomBlockRenderer, HTMLContentModel, HTMLElementModel
} from 'react-native-render-html';

import { Avatar, Button, Icon, ListItem, Text, useTheme } from '@rneui/themed';

import { getAuthor, getPost } from '../../service/wordpress';
import { useGlobalState } from '../../store/globalContext';
import { globalStyle } from '../../utils/styles';
import PostHeader from './components/PostHeader';

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
    const [post, setPost] = useState<any>()
    const [author, setAuthor] = useState<any>()
    const { setLoading } = useGlobalState()

    useEffect(() => {
        setLoading(true)
        getPost(id).then(res => {
            setPost(res)
            return getAuthor(res.author)
        }).then(res => {
            setAuthor(res)
        }).finally(() => {
            setLoading(false)
        })
    }, [id])

    const onShare = () => {
        Sharing.shareAsync(post.link)
    }

    const renderersProps = {
        img: {
            enableExperimentalPercentWidth: true
        }
    };

    return post && <>
        <View style={{ flex: 1 }}>
            <PostHeader></PostHeader>
            <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <ScrollView>
                    <View style={{ padding: 16 }}>
                        <Text style={[globalStyle.postTitleFontStyle]}>{post.title.rendered}</Text>
                    </View>
                    <ListItem containerStyle={{ marginTop: 0, paddingVertical: 0 }}>
                        <Avatar rounded size={36} source={author?.avatar_urls[48].startsWith('https://secure.gravatar.com')
                            ? require('../../assets/avatars/default.png')
                            : { uri: author?.avatar_urls[48] }}></Avatar>
                        <ListItem.Content>
                            <ListItem.Title style={{ fontWeight: 'bold' }}>{author?.name}</ListItem.Title>
                            <ListItem.Subtitle>{moment(post?.date).format("YYYY-MM-DD hh:mm")}</ListItem.Subtitle>
                        </ListItem.Content>
                        <Button icon={<Icon name='share' size={18} color={theme.colors.primary} ></Icon>} buttonStyle={{ padding: 2 }}
                            title='分享' size='sm' type='outline' onPress={onShare}></Button>

                    </ListItem>
                    <RenderHtml ignoredDomTags={['button']}
                        // debug
                        baseStyle={{ paddingHorizontal: 16 }}
                        defaultTextProps={{ style: [globalStyle.postContentFontStyle] }}
                        enableExperimentalMarginCollapsing={true}
                        enableExperimentalBRCollapsing={true}
                        enableExperimentalGhostLinesPrevention={true}
                        customHTMLElementModels={customElementModels}
                        renderers={{ video: VideoRenderer, audio: AudioRenderer }}
                        renderersProps={renderersProps}
                        contentWidth={screenSize.width - 32}
                        source={{ html: post?.content.rendered }}></RenderHtml>
                </ScrollView>
                <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
                    <Button onPress={onShare} type='clear' titleStyle={{ color: theme.colors.black }} size='sm' title={'分享'} icon={<Icon name='share' size={18}></Icon>}></Button>
                    <Button type='clear' titleStyle={{ color: theme.colors.black }} size='sm' title={'5'} icon={<Icon name='comment' size={18}></Icon>}></Button>
                    <Button type='clear' titleStyle={{ color: theme.colors.black }} size='sm' title={'2'} icon={<Icon name='favorite' size={18}></Icon>}></Button>
                    <Button type='clear' titleStyle={{ color: theme.colors.black }} size='sm' title={'2'} icon={<Icon name='recommend' size={18}></Icon>}></Button>
                </View>
            </View>
        </View></>
}