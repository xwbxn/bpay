import { TouchableOpacity, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import * as Progress from 'react-native-progress';
import { Icon, Text } from '@rneui/themed';
import { normalizeSize } from '../../../utils';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useMatrixClient } from '../../../store/useMatrixClient';


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

export default function MessageFile(opts) {
    const { currentMessage, position, progress } = opts
    const filename = currentMessage.filename;
    const ext = filename?.split('.')[1] || undefined;
    currentMessage.text = null;
    const icon = fileTypeIcon[ext] || { name: 'unknowfile1', type: 'antdesign' };

    return (<View style={{ flexDirection: 'row', padding: 8, alignItems: 'center' }}>
        <Icon style={{ marginRight: 6 }} name={icon.name} type={icon.type} color={position === 'left' ? '#000' : '#fff'} size={40}></Icon>
        <View>
            <Text style={{ fontSize: 16, color: position === 'left' ? '#000' : '#fff' }}>{filename}</Text>
            <Text style={{ color: position === 'left' ? '#aaa' : '#fff' }}>{normalizeSize(currentMessage.size)}</Text>
        </View>
        {!!progress && <Progress.Circle color={position === 'left' ? undefined : '#ccc'} style={{ marginLeft: 5 }} size={30} progress={progress}></Progress.Circle>}
    </View>)
}

export const RenderFile = (props) => {

    const currentMessage = props.currentMessage
    const downloader = useRef<FileSystem.DownloadResumable>(null)
    const [progress, setProgress] = useState<number>(currentMessage.progress)
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
        if (currentMessage.isLocal) {
            Sharing.shareAsync(currentMessage.localUri, {
                dialogTitle: '选择应用',
                mimeType: currentMessage.event.getContent().info.mimetype
            })
            return
        }

        // 保存为本地缓存
        let url = currentMessage.event.getContent().url
        if (url.startsWith("mxc:/")) {
            url = client.mxcUrlToHttp(url)
        }
        const mediaId = new URL(url).pathname.split('/').slice(-1)[0]
        const cacheFilename = `${FileSystem.cacheDirectory}${mediaId}.file`
        if ((await FileSystem.getInfoAsync(cacheFilename)).exists) {
            Sharing.shareAsync(cacheFilename, {
                dialogTitle: '选择应用',
                mimeType: currentMessage.event.getContent().info.mimetype
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
                mimeType: currentMessage.event.getContent().info.mimetype
            })
        }
    }

    return <TouchableOpacity onPress={onPress}>
        <MessageFile currentMessage={currentMessage} position={props.position} progress={progress}></MessageFile>
    </TouchableOpacity>
}