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
    const { currentMessage, width, height, originUri } = opts
    const [fullscreen, setFullscreen] = useState(false)
    const [uri, setUri] = useState(opts.uri)
    const [placeholder] = useState(opts.uri)
    const [progress, setProgress] = useState<number>(null)
    const size = useWindowDimensions()
    const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();


    const renderFooter = () => (
        <View style={{ flexDirection: 'row', justifyContent: 'center', paddingBottom: 14, width: size.width }}>
            {uri !== originUri && originUri && <Button type='outline'
                buttonStyle={{ borderColor: '#fff' }}
                onPress={() => setUri(originUri)}
                titleStyle={{ color: '#fff' }} size='sm' title={'查看原图'}></Button>}
            {!!progress && <Progress.Bar color='#fff' progress={progress}></Progress.Bar>}
        </View>)

    const renderImage = () => {
        return <Image source={{ uri }}
            placeholder={{ uri: placeholder }}
            onProgress={(event) => {
                setProgress(event.loaded / event.total)
            }}
            onLoadEnd={() => setProgress(null)}
            style={{ width: size.width, height: size.height, aspectRatio: 1 }}></Image>
    }

    const saveToCamera = async () => {
        console.log('call saveToCamera')
        if (permissionResponse.status !== 'granted') {
            await requestPermission();
        }
        const localUri = FileSystem.cacheDirectory + currentMessage.filename
        const dl = FileSystem.createDownloadResumable(originUri, localUri, {}, (event) => {
            setProgress(event.totalBytesWritten / event.totalBytesExpectedToWrite)
        })
        await dl.downloadAsync()
        setProgress(null)
        await MediaLibrary.saveToLibraryAsync(localUri)
        Toast.show('已保存到相册')
    }

    if (fullscreen) {
        return <Overlay animationType='slide' isVisible={true} fullScreen overlayStyle={{ padding: 0 }} onRequestClose={() => setFullscreen(false)}>
            <ImageViewer imageUrls={[{ url: uri }]}
                onSave={saveToCamera}
                renderImage={renderImage}
                renderFooter={renderFooter}
                menuContext={{ saveToLocal: '保存到相册', cancel: '取消' }}
            ></ImageViewer>
        </Overlay>
    }

    return <TouchableOpacity onPress={() => setFullscreen(true)}>
        <Image source={{ uri }} style={[styles.image, { height, width }]}>
        </Image>
    </TouchableOpacity>
}

export const MessageImage = ({ containerStyle, currentMessage }) => {
    if (currentMessage == null) {
        return null;
    }

    let { w, h } = currentMessage
    const ratio = Math.max(currentMessage.h, currentMessage.w) / 150
    if (ratio > 1) {
        w = Math.floor(w / ratio)
        h = Math.floor(h / ratio)
    }

    return (<View style={[styles.container, containerStyle]}>
        <ImageRender currentMessage={currentMessage} uri={currentMessage.image} originUri={currentMessage.origin_image} width={w} height={h}></ImageRender>
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