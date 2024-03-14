import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ListItem } from '@rneui/base';
import { Avatar, Button, Divider, SearchBar, useTheme } from '@rneui/themed';

import { useMatrixClient } from '../../store/useMatrixClient';
import { EventType, User } from 'matrix-js-sdk';

export const Invite = ({ navigation }) => {

    useEffect(() => {
        // set nav bar
        navigation.setOptions({
            title: '我的好友'
        })
    }, [])

    const { theme } = useTheme()
    const { client } = useMatrixClient()
    const [search, setSearch] = useState("");
    const [inviteMembers, setInviteMembers] = useState([])
    const [members, setMembers] = useState<User[]>([])

    const updateSearch = (search) => {
        setSearch(search);
    };

    useEffect(() => {
        const direct = client.getAccountData(EventType.Direct)
        const users = []
        Object.keys(direct.getContent()).forEach(k => {
            const user = client.getUser(k)
            if (user) {
                users.push(user)
            }
        })
        setMembers(users)
    }, [])

    const searchUser = () => {
        client.getProfileInfo(`@${search}:chat.b-pay.life`).then(res => {
            console.log('res', res)
            inviteMembers.push({ id: search, displayname: res.displayname, avatar_url: res.avatar_url })
            setInviteMembers([...inviteMembers])
            setSearch('')
        }).catch(e => {
            Alert.alert('该用户不存在')
        })
    }

    const doInvite = () => {
        client.createRoom({
            invite: inviteMembers.map(m => `@${m.id}:chat.b-pay.life`),
            is_direct: inviteMembers.length === 1
        }).then(() => {
            navigation.goBack()
        }).catch(e => {
            Alert.alert("错误", e.data.error)
            console.log('创建聊天失败', JSON.stringify(e))
        })
    }

    return <View style={styles.container}>
        <SearchBar containerStyle={{ borderWidth: 0, borderColor: theme.colors.background, backgroundColor: theme.colors.background, paddingHorizontal: 12 }}
            inputContainerStyle={{ backgroundColor: theme.colors.grey5 }}
            round
            placeholder='搜索好友'
            value={search}
            onChangeText={updateSearch}
            onSubmitEditing={() => { searchUser() }}
        ></SearchBar>
        <View style={{ paddingHorizontal: 10, ...styles.content }}>
            <Divider style={{ width: '100%', marginVertical: 10 }}></Divider>
            {/* <Text style={{ color: theme.colors.grey3, paddingBottom: 10 }}>邀请列表</Text> */}
            {members.map(m => {
                return (
                    <ListItem topDivider bottomDivider key={m.userId} onPress={() => {
                        navigation.push('Member', { userId: m.userId })
                    }}>
                        <Avatar size={50} rounded title={m.displayName[0]} containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
                        <ListItem.Content>
                            <ListItem.Title style={{ fontSize: 22 }}>{m.displayName}</ListItem.Title>
                            <ListItem.Subtitle>{m.userId}</ListItem.Subtitle>
                        </ListItem.Content>
                        <ListItem.Chevron></ListItem.Chevron>
                    </ListItem>)
            })}
            {inviteMembers.length > 0 && <Button title={'确定'} onPress={() => doInvite()}></Button>}
        </View>
    </View>
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { backgroundColor: '#ffffff', flex: 1 },
})