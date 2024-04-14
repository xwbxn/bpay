
import { View, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import * as crypto from 'expo-crypto';
import * as Progress from 'react-native-progress';
import _ from 'lodash'

import { useMatrixClient } from '../../../store/useMatrixClient';
import { EventStatus, EventType, IEvent, MatrixEvent, MatrixEventEvent, MsgType, UploadProgress } from 'matrix-js-sdk';
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

export default function Upload({ event }: { event: MatrixEvent }) {
    const [progress, setProgress] = useState(0)
    const { client } = useMatrixClient()
    const content = event.getContent()

    const cloneEvent = (newContent: any) => {
        const eventObject: Partial<IEvent> = {
            type: EventType.RoomMessage,
            content: newContent
        };
        const newEvent = new MatrixEvent(Object.assign(eventObject, {
            event_id: event.getId(),
            user_id: client.credentials.userId,
            sender: client.credentials.userId,
            room_id: event.getRoomId(),
            origin_server_ts: event.event.origin_server_ts,
        }));
        return newEvent
    }

    useEffect(() => {
        if (content.msgtype === MsgType.Video || content.msgtype === MsgType.Image) {
            (async () => {
                const newContent = _.cloneDeep(content)
                if (content.info.thumbnail_url) {
                    const uploadedThumb = await client.uploadFile({
                        uri: content.info.thumbnail_url,
                        name: crypto.randomUUID(),
                        mimeType: content.info.thumbnail_info.mimetype,
                    })
                    newContent.info.thumbnail_url = uploadedThumb.content_uri
                }
                const uploaded = await client.uploadFile({
                    uri: content.url,
                    mimeType: content.info.mimetype,
                    name: content.body,
                    callback: (progress: UploadProgress) => {
                        setProgress(progress.loaded / progress.total)
                    }
                })
                newContent.url = uploaded.content_uri
                event.emit(MatrixEventEvent.Replaced, cloneEvent(newContent))
            })()
        }

        // if (opts.type === 'file') {
        //     (async () => {
        //         const uploaded = await client.uploadFile({
        //             uri: opts.uri,
        //             mimeType: opts.mimeType,
        //             name: uname,
        //             callback: (progress: UploadProgress) => {
        //                 setProgress(progress.loaded / progress.total)
        //             }
        //         })
        //         opts.onUploaded && opts.onUploaded(uploaded.content_uri)
        //     })()
        // }
    }, [])

    if ([MsgType.Video, MsgType.Image].includes(content.msgtype as MsgType)) {
        let width = content.info.thumbnail_info.w
        let height = content.info.thumbnail_info.h
        if (width > 150 || height > 150) {
            const ratio = Math.max(width, height) / 150
            width = width / ratio
            height = height / ratio
        }
        return (
            <View style={{ width: width + 6, height: height + 6 }}>
                <View style={{
                    position: 'absolute', zIndex: 1, alignItems: 'center', justifyContent: 'center',
                    width, height
                }}>
                    <Progress.Circle size={50} progress={progress}></Progress.Circle>
                </View>
                <Image style={{ ...styles.image, width, height, opacity: 0.8 }}
                    source={{ uri: content.info.thumbnail_url }}></Image>
            </View>
        )
    }


    // if (opts.type === 'file') {
    //     return <MessageFile currentMessage={{ filename: opts.name, size: opts.size }} position='right' progress={progress} />
    // }
}

export const renderCustomView = (props) => {
    const currentMessage = props.currentMessage
    const event: MatrixEvent = currentMessage.event

    if (event.status === EventStatus.SENDING) {
        currentMessage.image = null
        currentMessage.text = null
        currentMessage.video = null
        currentMessage.audio = null
        return <Upload event={event}></Upload>
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

