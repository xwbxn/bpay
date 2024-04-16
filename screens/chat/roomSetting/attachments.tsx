import { View, Text, FlatList } from 'react-native'
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import moment from 'moment'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useMatrixClient } from '../../../store/useMatrixClient'
import { EventType, IEvent, Room } from 'matrix-js-sdk'
import BpayHeader from '../../../components/BpayHeader'
import { Button, Icon, Input, ListItem, useTheme } from '@rneui/themed'
import Toast from 'react-native-root-toast';

const FILETYPE = ['doc', 'docx', 'zip', 'gz', 'ppt', 'pptx', 'xls', 'xlsx', 'apk', 'rar', 'txt', 'pdf',]
const EXCLUDE_TYPE = ['png', 'jpg', 'jpeg', 'bmp', 'gif']

export default function RoomDocuments({ navigation, route }) {

    const { theme } = useTheme()
    const { id, title } = route.params
    const { client } = useMatrixClient()
    const [room] = useState<Room>(client.getRoom(id))
    const [searchVal, setSearchVal] = useState('')
    const downloadTasks = useRef<string[]>([])
    const [documents, setDocuments] = useState<{ name: string, sender: string, url: string, downloaded: boolean }[]>([])
    const [filterdDocuments, setfilterdDocuments] = useState<{ name: string, sender: string, url: string, downloaded: boolean }[]>([])

    const loadMore = async () => {
        let token = client.getSyncStateData().nextSyncToken
        while (token) {
            const res: any = await client.getMediaMessages(id, token, 50, 'b', { types: [EventType.RoomMessage], contains_url: true })
            const data = res.chunk.map((e: IEvent) => ({
                name: e.content.body,
                sender: room.getMember(e.sender).name,
                url: e.content.url,
                ts: e.origin_server_ts,
                mimeType: e.content.info.mimetype,
                percent: ''
            }))
            for (const item of data) {
                item.downloaded = (await FileSystem.getInfoAsync(getLocalName({ name: item.name }))).exists
            }
            setDocuments(prev => prev.concat(data))
            token = res.end
        }
    }

    const ensureDirExists = async () => {
        const localDir = FileSystem.documentDirectory + '/download'
        const dirInfo = await FileSystem.getInfoAsync(localDir);
        if (!dirInfo.exists) {
            console.log("directory doesn't exist, creating…");
            await FileSystem.makeDirectoryAsync(localDir, { intermediates: true });
        }
    }

    useEffect(() => {
        setfilterdDocuments(documents
            .filter(i => !EXCLUDE_TYPE.includes(i.name.toLowerCase().split('.')[1]))
            .filter(i => searchVal !== '' ? i.name.toLowerCase().includes(searchVal.toLowerCase()) : true))
    }, [documents, searchVal])

    useEffect(() => {
        if (!room) {
            return
        }
        loadMore()
    }, [room])

    const download = async (item) => {
        if (downloadTasks.current.includes(item.url)) {
            return
        }

        await ensureDirExists()
        const localName = getLocalName(item)
        const dl = FileSystem.createDownloadResumable(client.mxcUrlToHttp(item.url), localName, {}, (downloadProgress) => {
            const progress = downloadProgress.totalBytesWritten * 100 / downloadProgress.totalBytesExpectedToWrite
            item.percent = `${progress.toFixed(0)}%`
            setDocuments([...documents])
        })
        downloadTasks.current.push(item.url)
        dl.downloadAsync().then(res => {
            item.percent = ''
            item.downloaded = true
            setDocuments([...documents])
            Toast.show(localName)
            downloadTasks.current.splice(downloadTasks.current.findIndex(v => v === item.url), 1)
        })
    }

    const renderItem = useCallback(({ item }) => {
        return <>
            <ListItem bottomDivider>
                <ListItem.Content>
                    <ListItem.Title style={{ fontSize: 18 }}>{item.name}</ListItem.Title>
                    <ListItem.Subtitle style={{ color: theme.colors.grey2 }}>{item.sender} {moment(item.ts).format("YYYY-MM-DD")}</ListItem.Subtitle>
                </ListItem.Content>
                {item.downloaded
                    ? <Button title={'打开'} type='clear' onPress={async () => {
                        Sharing.shareAsync(getLocalName(item), {
                            dialogTitle: '选择应用',
                            mimeType: item.mimeType
                        })
                    }}></Button>
                    : item.percent === ''
                        ? <Button title={'下载'} type='clear' onPress={() => { download(item) }}></Button>
                        : <Text>{item.percent}</Text>}
            </ListItem>
        </>
    }, [documents])

    return (
        <View>
            <BpayHeader showback title={title || '群文件'}></BpayHeader>
            <View>
                <Input value={searchVal} onChangeText={setSearchVal} errorStyle={{ height: 0 }}
                    inputStyle={{ paddingLeft: 10 }}
                    rightIcon={<Icon name='search' color={theme.colors.grey5}></Icon>}
                    containerStyle={{ paddingTop: 10, paddingBottom: 0, marginBottom: 0 }} placeholder='搜索'
                    inputContainerStyle={{ height: 40, borderBottomWidth: 0, backgroundColor: theme.colors.background, borderRadius: 10 }}></Input>
            </View>
            <FlatList data={filterdDocuments} renderItem={renderItem}></FlatList>
        </View>
    )

    function getLocalName(item: any) {
        return FileSystem.documentDirectory + '/download/' + item.name;
    }
}