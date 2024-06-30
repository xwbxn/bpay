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
import { useProfile } from '../../../store/profileContext';

const FILETYPE = ['doc', 'docx', 'zip', 'gz', 'ppt', 'pptx', 'xls', 'xlsx', 'apk', 'rar', 'txt', 'pdf',]
const EXCLUDE_TYPE = ['jpeg', 'jpg', 'jpeg', 'bmp', 'gif']

export default function RoomDocuments({ navigation, route }) {

    const { theme } = useTheme()
    const { id, title } = route.params
    const { client } = useMatrixClient()
    const [room] = useState<Room>(client.getRoom(id))
    const [searchVal, setSearchVal] = useState('')
    const downloadTasks = useRef<string[]>([])
    const [documents, setDocuments] = useState<{ name: string, sender: string, url: string, downloaded: boolean, mimeType: string}[]>([])
    const [filterdDocuments, setfilterdDocuments] = useState<{ name: string, sender: string, url: string, downloaded: boolean }[]>([])
    const [mediaAlias, setMediaAlias] = useState<{ [id: string]: string }>({})

    const loadMore = async () => {
        let token = client.getSyncStateData().nextSyncToken
        while (token) {
            const res: any = await client.getMediaMessages(id, token, 50, 'b', { types: [EventType.RoomMessage], contains_url: true })
            const data = res.chunk.map((e: IEvent) => ({
                eventId: e.event_id,
                name: e.content.body,
                sender: room.getMember(e.sender).name,
                senderId: room.getMember(e.sender).userId,
                url: e.content.url,
                ts: e.origin_server_ts,
                mimeType: e.content.info.mimetype || 'application/stream',
                percent: ''
            }))
            for (const item of data) {
                console.log('item.mineType', item.mimeType)
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
            .filter(i => !EXCLUDE_TYPE.includes(i.mimeType.split('/')[1]))
            .filter(i => searchVal !== '' ? i.name.toLowerCase().includes(searchVal.toLowerCase()) : true))
    }, [documents, searchVal])

    useEffect(() => {
        if (!room) {
            return
        }
        client.setRoomAccountData(room.roomId, 'm.media.alias', {
            '$4P0Xlf4p1_thldnNaZxAIWlpUwslcr2sfmzl-T0e-TU': '我的名字'
        })
        const alias = room.getAccountData('m.media.alias')
        if (alias) {
            setMediaAlias(alias.getContent())
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
                    <ListItem.Title style={{ fontSize: 18 }}>{mediaAlias[item.eventId] || item.name}</ListItem.Title>
                    <ListItem.Subtitle style={{ color: theme.colors.grey2 }}>{item.sender} {moment(item.ts).format("YYYY-MM-DD")}</ListItem.Subtitle>
                </ListItem.Content>
                {item.downloaded
                    ? <Button title={'打开'} size='sm' type='clear' onPress={async () => {
                        Sharing.shareAsync(getLocalName(item), {
                            dialogTitle: '选择应用',
                            mimeType: item.mimeType
                        })
                    }}></Button>
                    : item.percent === ''
                        ? <Button size='sm' title={'下载'} type='clear' onPress={() => { download(item) }}></Button>
                        : <Text>{item.percent}</Text>}
                {(client.canDo(room.roomId, 'm.room.name') || item.senderId === client.getUserId()) && <Button type='clear' size='sm'>重命名</Button>}
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