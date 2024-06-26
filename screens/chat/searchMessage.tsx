import _ from 'lodash';
import moment from 'moment';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@rneui/themed';

import BpayHeader from '../../components/BpayHeader';
import { useMatrixClient } from '../../store/useMatrixClient';
import { IListItem, ListView } from './components/ListView';

export default function SearchMessage({ navigation, route }) {

    const [searchVal, setSearchVal] = useState('')
    const { client } = useMatrixClient()
    const [result, setResult] = useState<any>({})
    const [rooms, setRooms] = useState<IListItem[]>([])
    const [selectedRoom, setSelectedRoom] = useState<string>()
    const [messages, setMessages] = useState<IListItem[]>([])
    const roomId = route.params?.roomId

    const doSearch = useCallback(_.debounce((searchVal) => {
        client.searchEvent(null, searchVal).then(rows => {
            setSelectedRoom(null)
            setResult(rows);
            const _result: IListItem[] = [];
            for (const key in rows) {
                //房间内查询找，过滤掉其他的
                if (roomId && key !== roomId) {
                    continue
                }
                if (Object.prototype.hasOwnProperty.call(rows, key)) {
                    const element = rows[key];
                    const room = client.getRoom(key);
                    if (room) {
                        _result.push({
                            id: key,
                            title: room.name,
                            subtitle: `${element.length}条相关的聊天记录`,
                            avatar: room.getAvatarUrl(client.baseUrl, 50, 50, 'scale')
                        });
                    }
                }
            }
            setRooms(_result);
        });
    }, 500, { trailing: true }), [client])

    const onSearch = () => {
        if (searchVal && searchVal.length > 0) {
            doSearch(searchVal);
        }
    }

    useEffect(() => {
        onSearch()
    }, [searchVal])


    const onPressRoom = (item) => {
        const _messages = result[item.id]
        const room = client.getRoom(item.id)
        setSelectedRoom(item.id)
        setMessages(_messages.map(i => {
            const sender = room.getMember(i.sender)
            return {
                id: i.event_id,
                title: sender?.name || i.sender,
                subtitle: i.content.body,
                right: moment(i.origin_server_ts).format('YYYY-MM-DD hh:mm'),
                avatar: sender.getAvatarUrl(client.baseUrl, 50, 50, 'scale', true, true)
            }
        }))
    }

    const onPressMessage = (item) => {
        navigation.push('Room', { id: selectedRoom, search: { initEventId: item.id, keyword: searchVal } })
    }

    const searchInput = <View>
        <TextInput value={searchVal} onChangeText={setSearchVal}
            placeholder='搜索'
            inputMode='search'
            onSubmitEditing={onSearch}
            style={{ width: 200 }}
        ></TextInput>
    </View>

    return (
        <View style={styles.container}>
            <BpayHeader showback
                onBack={selectedRoom ? () => { setSelectedRoom(null) } : undefined}
                title='搜索'
                centerComponent={searchInput}
                centerContainerStyle={{ backgroundColor: '#fff', borderRadius: 5, alignItems: 'flex-start', paddingLeft: 10 }}
                rightComponent={<Icon name='search' color={'#fff'} type='feather' style={{ marginHorizontal: 14 }} onPress={onSearch}></Icon>}
            ></BpayHeader>
            <View>
                <ScrollView>
                    {rooms.length > 0 &&
                        <ListView items={selectedRoom ? rooms.filter(i => i.id === selectedRoom) : rooms} accordion accordionTitle='聊天记录' accordionExpand={true} onPressItem={onPressRoom}></ListView>}
                    {messages.length > 0 && selectedRoom && (<View style={{ marginTop: 8 }}>
                        <ListView accordionTitle={`${messages.length}条相关的聊天记录`} accordion items={messages} highlight={new RegExp(searchVal)} onPressItem={onPressMessage}></ListView>
                    </View>)}
                </ScrollView>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { backgroundColor: '#ffffff' },
})