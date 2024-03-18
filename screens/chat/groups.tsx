import { Preset } from 'matrix-js-sdk';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { ListItem } from '@rneui/base';
import { BottomSheet, Button, Input, SearchBar, Text, useTheme } from '@rneui/themed';

import { useMatrixClient } from '../../store/useMatrixClient';
import { IListItem, ListView } from './components/ListView';

export const GroupChat = ({ navigation, route }) => {

    useEffect(() => {
        // set nav bar
        navigation.setOptions({
            title: '发起群聊'
        })
    }, [])

    const {initValue} = route.params

    const { theme } = useTheme()
    const { client } = useMatrixClient()
    const [searchVal, setSearchVal] = useState('')
    const [members, setMembers] = useState<IListItem[]>([])
    const [selected, setSelected] = useState<IListItem[]>([])
    const [isGroupOptionVisible, setIsGroupOptionVisible] = useState(false)
    const [groupName, setGroupName] = useState('')
    const [groupTopic, setGroupTopic] = useState('')
    const [nameError, setNameError] = useState('')

    useEffect(() => {
        const friends = client.getFriends()
        setMembers(friends.map(i => ({
            id: i.userId,
            title: i.name,
            subtitle: i.userId,
            avatar: i.avatar_url,
        })))
    }, [])

    const searchUser = (search) => {
        setSearchVal(search)
    }

    const onCreateGroup = () => {
        if (selected.length == 0) {
            Alert.alert("至少需要选择一个联系人")
            return
        }
        setIsGroupOptionVisible(true)
    }

    const createGroup = () => {
        if (groupName === '') {
            setNameError('必填项')
            return
        }
        client.createRoom({
            is_direct: false,
            preset: Preset.PrivateChat,
            invite: selected.map(s => s.id as string),
            name: groupName,
            topic: groupTopic
        }).then((res) => {
            navigation.replace('Room', {
                id: res.room_id
            })
        })
    }

    return <View style={styles.container}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff' }}>
            <SearchBar
                containerStyle={{ flex: 1, borderWidth: 0, borderColor: theme.colors.background, backgroundColor: theme.colors.background, paddingHorizontal: 12 }}
                inputContainerStyle={{ backgroundColor: theme.colors.grey5 }}
                round
                value={searchVal}
                placeholder='搜索联系人'
                onChangeText={searchUser}
            ></SearchBar>
            <Button title={'建群'} radius={15} onPress={onCreateGroup}
                titleStyle={{ fontSize: 18 }} containerStyle={{ backgroundColor: '#ffffff', marginRight: 10 }}></Button>
        </View>
        <View style={{ paddingHorizontal: 10, ...styles.content }}>
            <ScrollView>
                <ListView items={members} search={searchVal} enableSelect multiSelect onSelected={setSelected}></ListView>
            </ScrollView>
        </View>
        <BottomSheet modalProps={{}} isVisible={isGroupOptionVisible}>
            <ListItem>
                <ListItem>
                    <Text h4>确认群组设置</Text>
                </ListItem>
            </ListItem>
            <ListItem>
                <ListItem.Content>
                    <Input value={groupName} onChangeText={setGroupName} placeholder='群组名称(必填)' errorMessage={nameError}></Input>
                    <Input value={groupTopic} onChangeText={setGroupTopic} placeholder='群组话题(选填)'></Input>
                </ListItem.Content>
            </ListItem>
            <Button containerStyle={styles.buttonContainer} onPress={createGroup}>确定</Button>
            <Button containerStyle={styles.buttonContainer} color={'error'} onPress={() => setIsGroupOptionVisible(false)}>取消</Button>
        </BottomSheet>
    </View>
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { backgroundColor: '#ffffff', flex: 1 },
    buttonContainer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#ffffff'
    }
})