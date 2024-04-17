import { Button, Overlay } from '@rneui/themed';
import { Image } from 'expo-image';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { StylePropType } from 'react-native-gifted-chat';
import * as Progress from 'react-native-progress';
// TODO: support web
import ImageViewer from 'react-native-image-zoom-viewer';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import Toast from 'react-native-root-toast';
import { useMatrixClient } from '../../../store/useMatrixClient';

const styles = StyleSheet.create({
    container: {
    },
    image: {
        borderRadius: 13,
        margin: 3,
        resizeMode: 'cover'
    },
    imageActive: {
        flex: 1,
        resizeMode: 'contain',
    },
});

const ImageRender = (opts) => {
    const { currentMessage, onLongPress } = opts
    const content = currentMessage.event.getContent()
    const [fullscreen, setFullscreen] = useState(false)
    const [showOriginImage, setShowOriginImage] = useState(false)
    const { client } = useMatrixClient()
    const [progress, setProgress] = useState<number>(null)
    const size = useWindowDimensions()
    const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

    let url = (content.url.startsWith('mxc://')) ?
        client.mxcUrlToHttp(content.url) :
        content.url
    let thumbnail_url = (content.info.thumbnail_url && content.info.thumbnail_url?.startsWith('mxc://')) ?
        client.mxcUrlToHttp(content.info.thumbnail_url) :
        content.info.thumbnail_url

    let width = content.info.thumbnail_info?.w || content.info.w
    let height = content.info.thumbnail_info?.h || content.info.h
    if (width > 150 || height > 150) {
        const ratio = Math.max(width, height) / 150
        width = width / ratio
        height = height / ratio
    }

    const renderFooter = () => (
        <View style={{ flexDirection: 'row', justifyContent: 'center', paddingBottom: 14, width: size.width }}>
            {!!thumbnail_url && url !== thumbnail_url && !showOriginImage && <Button type='outline'
                buttonStyle={{ borderColor: '#fff' }}
                onPress={() => setShowOriginImage(true)}
                titleStyle={{ color: '#fff' }} size='sm' title={'查看原图'}></Button>}
            {!!progress && <Progress.Bar color='#fff' progress={progress}></Progress.Bar>}
        </View>)

    const renderImage = (props) => {
        return <Image {...props}
            onProgress={(event) => {
                setProgress(event.loaded / event.total)
            }}
            onLoadEnd={() => setProgress(null)}></Image>
    }

    const saveToCamera = async () => {
        if (permissionResponse.status !== 'granted') {
            await requestPermission();
        }
        const localUri = FileSystem.cacheDirectory + currentMessage.filename
        const dl = FileSystem.createDownloadResumable(url, localUri, {}, (event) => {
            setProgress(event.totalBytesWritten / event.totalBytesExpectedToWrite)
        })
        await dl.downloadAsync()
        setProgress(null)
        await MediaLibrary.saveToLibraryAsync(localUri)
        Toast.show('已保存到相册')
    }

    if (fullscreen) {
        return <Overlay animationType='slide' isVisible={true} fullScreen
            overlayStyle={{ padding: 0 }} onRequestClose={() => setFullscreen(false)}>
            <ImageViewer imageUrls={[{ url: showOriginImage ? url : thumbnail_url }]}
                onSave={saveToCamera}
                renderImage={renderImage}
                renderFooter={renderFooter}
                menuContext={{ saveToLocal: '保存到相册', cancel: '取消' }}
            ></ImageViewer>
        </Overlay>
    }

    return <TouchableOpacity onPress={() => setFullscreen(true)} onLongPress={onLongPress}>
        <View style={{ alignItems: 'center' }}>
            <Image source={{ uri: thumbnail_url || url }} style={[styles.image, { height, width }]}>
            </Image>
        </View>
    </TouchableOpacity>
}

export const MessageImage = ({ containerStyle, currentMessage, onLongPress }) => {
    if (currentMessage == null) {
        return null;
    }

    return (<View style={[styles.container, containerStyle]}>
        <ImageRender currentMessage={currentMessage} onLongPress={onLongPress}></ImageRender>
    </View>);
}
MessageImage.propTypes = {
    currentMessage: PropTypes.object,
    containerStyle: StylePropType,
    imageStyle: StylePropType,
    imageProps: PropTypes.object,
    lightboxProps: PropTypes.object,
};
//# sourceMappingURL=MessageImage.js.map