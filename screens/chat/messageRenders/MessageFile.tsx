import { TouchableOpacity, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import * as Progress from 'react-native-progress';
import { Icon, Text } from '@rneui/themed';
import { normalizeSize } from '../../../utils';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useMatrixClient } from '../../../store/useMatrixClient';
import { useWindowDimensions } from 'react-native';
import { MatrixEvent } from 'matrix-js-sdk';


export const fileTypeIcon = {
    'xls': { name: 'exclefile1', type: 'antdesign' },
    'xlsx': { name: 'exclefile1', type: 'antdesign' },
    'csv': { name: 'exclefile1', type: 'antdesign' },
    'xlsm': { name: 'exclefile1', type: 'antdesign' },
    'ppt': { name: 'pptfile1', type: 'antdesign' },
    'pptx': { name: 'pptfile1', type: 'antdesign' },
    'pdf': { name: 'pdffile1', type: 'antdesign' },
    'doc': { name: 'wordfile1', type: 'antdesign' },
    'docx': { name: 'wordfile1', type: 'antdesign' },
    'txt': { name: 'filetext1', type: 'antdesign' },
    'zip': { name: 'file-archive-o', type: 'font-awesome' },
    'rar': { name: 'file-archive-o', type: 'font-awesome' },
    'gz': { name: 'file-archive-o', type: 'font-awesome' }
}

export default function RenderFile(opts: { event: MatrixEvent, position: 'left' | 'right', progress: number }) {
    const { event, position, progress } = opts
    const content = event.getContent()
    const filename = content.body;
    const ext = filename?.split('.')[1] || undefined;
    const icon = fileTypeIcon[ext] || { name: 'unknowfile1', type: 'antdesign' }
    const { width } = useWindowDimensions()

    return (<View style={{ padding: 8 }}>
        <View style={{ flexDirection: 'row', width: width * 2 / 3 }}>
            <View style={{ width: 40 }}>
                <Icon style={{ marginRight: 6 }}
                    name={icon.name} type={icon.type}
                    color={position === 'left' ? '#000' : '#fff'} size={40}></Icon>
            </View>
            <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontSize: 16, color: position === 'left' ? '#000' : '#fff' }}>{filename}</Text>
                <Text style={{ color: position === 'left' ? '#aaa' : '#fff' }}>{normalizeSize(content.info.size)}</Text>
            </View>
            {progress > 0 &&
                <Progress.Circle color={position === 'left' ? undefined : '#ccc'} style={{ marginLeft: 5 }} size={30} progress={progress}>
                </Progress.Circle>}
        </View>
    </View>)
}

export const MessageFile = (props) => {

    const currentMessage = props.currentMessage
    const content = currentMessage.event.getContent()
    const downloader = useRef<FileSystem.DownloadResumable>(null)
    const [progress, setProgress] = useState<number>(0)
    const { client } = useMatrixClient()

    useEffect(() => {
        return () => {
            if (downloader.current) {
                downloader.current.cancelAsync()
            }
        }
    }, [])

    const onPress = async () => {
        if (downloader.current !== null) {
            return
        }

        // 本地原始文件
        if (content.url.startsWith("file://")) {
            Sharing.shareAsync(content.url, {
                dialogTitle: '选择应用',
                mimeType: content.info.mimetype
            })
            return
        }

        // 保存为本地缓存
        let url = content.url
        if (url.startsWith("mxc:/")) {
            url = client.mxcUrlToHttp(url)
        }
        const mediaId = new URL(url).pathname.split('/').slice(-1)[0]
        const cacheFilename = `${FileSystem.cacheDirectory}${mediaId}.file`
        if ((await FileSystem.getInfoAsync(cacheFilename)).exists) {
            Sharing.shareAsync(cacheFilename, {
                dialogTitle: '选择应用',
                mimeType: content.info.mimetype
            })
        } else {
            const dl = FileSystem.createDownloadResumable(url, cacheFilename, {}, (downloadProgress) => {
                const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite
                setProgress(progress)
            })

            downloader.current = dl
            await dl.downloadAsync()
            downloader.current = null
            setProgress(null)
            Sharing.shareAsync(cacheFilename, {
                dialogTitle: '选择应用',
                mimeType: content.info.mimetype
            })
        }
    }

    return <TouchableOpacity onPress={onPress} onLongPress={props.onLongPress}>
        <RenderFile event={currentMessage.event} position={props.position} progress={progress}></RenderFile>
    </TouchableOpacity>
}