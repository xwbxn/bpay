
import { View, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import * as vt from 'expo-video-thumbnails';
import * as crypto from 'expo-crypto';
import * as Progress from 'react-native-progress';
import { manipulateAsync } from 'expo-image-manipulator';

import { useMatrixClient } from '../../../store/useMatrixClient';
import { UploadProgress } from 'matrix-js-sdk';
import { Image } from 'expo-image';
import MessageFile, { RenderFile } from './MessageFile';


export interface IUploadInfo {
    uri: string,
    type: 'video' | 'audio' | 'image' | 'file',
    name: string,
    width?: number,
    height?: number,
    mimeType?: string,
    size?: number,
    onUploaded?: (uri: string,
        thumbnail: { local_uri: string, uri: string, width: number, height: number, mimetype: string }) => void
}

export default function Upload({ opts }) {
    const [progress, setProgress] = useState(0)
    const [image, setImage] = useState<string>()
    const { client } = useMatrixClient()
    const [height, setHeight] = useState(opts.height)
    const [width, setWidth] = useState(opts.width)

    if (width > 150 || height > 150) {
        const ratio = Math.max(width, height) / 150
        setWidth(width / ratio)
        setHeight(height / ratio)
    }

    useEffect(() => {
        const uname = crypto.randomUUID()
        if (opts.type === 'video') {
            // 生成缩略图
            (async () => {
                const thumbnail = await vt.getThumbnailAsync(opts.uri, {
                    quality: 0.5
                })
                setImage(thumbnail.uri)
                const ratio = Math.max(thumbnail.height, thumbnail.width) / 150
                setWidth(thumbnail.width / ratio)
                setHeight(thumbnail.height / ratio)
                const uploadedThumb = await client.uploadFile({
                    uri: thumbnail.uri,
                    name: uname,
                    mimeType: opts.mimeType,
                })
                const uploaded = await client.uploadFile({
                    uri: opts.uri,
                    mimeType: opts.mimeType,
                    name: uname,
                    callback: (progress: UploadProgress) => {
                        setProgress(progress.loaded / progress.total)
                    }
                })
                opts.onUploaded && opts.onUploaded(uploaded.content_uri, {
                    uri: uploadedThumb.content_uri,
                    width: thumbnail.width,
                    height: thumbnail.height,
                    mimetype: opts.mimeType,
                    local_uri: thumbnail.uri
                })
            })()
        }
        if (opts.type === 'image') {
            (async () => {
                setImage(opts.uri)
                let thumbnail, uploadedThumb
                if (opts.height > 1920 || opts.width > 1080) {
                    thumbnail = await manipulateAsync(opts.uri, [
                        {
                            resize: { height: height * 8, width: width * 8 }
                        }
                    ])
                    uploadedThumb = await client.uploadFile({
                        uri: thumbnail.uri,
                        name: `${uname}-thumbnail`,
                        mimeType: opts.mimeType,
                        callback: (progress: UploadProgress) => {
                            setProgress(progress.loaded * 0.3 / progress.total)
                        }
                    })
                }
                const uploaded = await client.uploadFile({
                    uri: opts.uri,
                    mimeType: opts.mimeType,
                    name: uname,
                    callback: (progress: UploadProgress) => {
                        setProgress((progress.loaded * 0.7 / progress.total) + 0.3)
                    }
                })

                opts.onUploaded && opts.onUploaded(uploaded.content_uri, {
                    uri: uploadedThumb?.content_uri || uploaded.content_uri,
                    width: thumbnail?.width || opts.width,
                    height: thumbnail?.height || opts.height,
                    mimetype: opts.mimeType,
                    local_uri: thumbnail?.uri || opts.uri
                })
            })()
        }
        if (opts.type === 'file') {
            (async () => {
                const uploaded = await client.uploadFile({
                    uri: opts.uri,
                    mimeType: opts.mimeType,
                    name: uname,
                    callback: (progress: UploadProgress) => {
                        setProgress(progress.loaded / progress.total)
                    }
                })
                opts.onUploaded && opts.onUploaded(uploaded.content_uri)
            })()
        }
    }, [])

    if (opts.type === 'video' || opts.type === 'image') {
        return (
            <View style={{ width: width + 6, height: height + 6 }}>
                <View style={{
                    position: 'absolute', zIndex: 1, alignItems: 'center', justifyContent: 'center',
                    width, height
                }}>
                    <Progress.Circle size={50} progress={progress}></Progress.Circle>
                </View>
                <Image style={{ ...styles.image, width, height, opacity: 0.8 }}
                    source={{ uri: image }}></Image>
            </View>
        )
    }
    if (opts.type === 'file') {
        return <MessageFile currentMessage={{ filename: opts.name, size: opts.size }} position='right' progress={progress} />
    }
}

export const renderCustomView = (props) => {
    const currentMessage = props.currentMessage

    if (currentMessage.uploadInfo) {
        currentMessage.image = null
        currentMessage.text = null
        currentMessage.video = null
        currentMessage.audio = null
        return <Upload opts={currentMessage.uploadInfo}></Upload>
    }

    if (currentMessage.file) {
        currentMessage.text = null
        return <RenderFile {...props}></RenderFile>
    }

    return null
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center'
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

