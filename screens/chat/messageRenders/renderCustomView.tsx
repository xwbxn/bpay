
import * as crypto from 'expo-crypto';
import { Image } from 'expo-image';
import _ from 'lodash';
import {
    EventStatus, EventType, IEvent, MatrixEvent, MatrixEventEvent, MsgType, UploadProgress
} from 'matrix-js-sdk';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Progress from 'react-native-progress';

import { useMatrixClient } from '../../../store/useMatrixClient';
import RenderFile, { MessageFile } from './MessageFile';

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

                console.log('upload', content.url)
                const uploaded = await client.uploadFile({
                    uri: content.url,
                    mimeType: content.info.mimetype,
                    name: content.body,
                    callback: (progress: UploadProgress) => {
                        console.log('progress', progress)
                        setProgress(progress.loaded / progress.total)
                    }
                })

                newContent.url = uploaded.content_uri
                event.emit(MatrixEventEvent.Replaced, cloneEvent(newContent))
            })()
        }

        if (content.msgtype === MsgType.File) {
            (async () => {
                const newContent = _.cloneDeep(content)
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
    }, [])

    if ([MsgType.Video, MsgType.Image].includes(content.msgtype as MsgType)) {
        let width = content.info.thumbnail_info?.w || content.info.w
        let height = content.info.thumbnail_info?.h || content.info.h
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
                    source={{ uri: content.info.thumbnail_url || content.url }}></Image>
            </View>
        )
    }


    if (content.msgtype === MsgType.File) {
        return <RenderFile event={event} position='right' progress={progress} />
    }
}

export const renderCustomView = (props) => {
    const currentMessage = props.currentMessage
    const event: MatrixEvent = currentMessage.event

    if (!event) {
        return null
    }

    if (event.status === EventStatus.SENDING) {
        // 文件上传样式
        if ([MsgType.Audio, MsgType.Video, MsgType.Image, MsgType.File].includes(event.getContent().msgtype as MsgType)) {
            currentMessage.image = null
            currentMessage.text = null
            currentMessage.video = null
            currentMessage.audio = null
            return <Upload event={event}></Upload>
        }
    }

    // 自定义消息样式
    if (event.getContent().msgtype === MsgType.File) {
        currentMessage.text = null
        return <MessageFile {...props}></MessageFile>
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

