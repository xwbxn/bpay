import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ListItem } from '@rneui/base';
import { Avatar, Button, Divider, SearchBar, useTheme } from '@rneui/themed';

import { useMatrixClient } from '../../store/useMatrixClient';

export const Invite = ({ navigation }) => {

    useEffect(() => {
        // set nav bar
        navigation.setOptions({
            title: '添加好友'
        })
    }, [])

    const { theme } = useTheme()
    const [searchVal, setSearchVal] = useState('')
    const { client } = useMatrixClient()
    const [search, setSearch] = useState("");
    const [inviteMembers, setInviteMembers] = useState([])

    const updateSearch = (search) => {
        setSearch(search);
    };

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
            placeholder='使用bpayID搜索好友后开始聊天'
            value={search}
            onChangeText={updateSearch}
            onSubmitEditing={() => { searchUser() }}
        ></SearchBar>
        <View style={{ paddingHorizontal: 10, ...styles.content }}>
            <Divider style={{ width: '100%', marginVertical: 10 }}></Divider>
            {/* <Text style={{ color: theme.colors.grey3, paddingBottom: 10 }}>邀请列表</Text> */}
            {inviteMembers.map(m => {
                return <ListItem topDivider bottomDivider key={m.id}>
                    <Avatar size={50} rounded title={m.displayname[0]} containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
                    <ListItem.Content>
                        <ListItem.Title>{m.displayname}</ListItem.Title>
                        <ListItem.Subtitle>{m.id}</ListItem.Subtitle>
                    </ListItem.Content>
                </ListItem>
            })}
            {inviteMembers.length > 0 && <Button title={'确定'} onPress={() => doInvite()}></Button>}
        </View>
    </View>
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { backgroundColor: '#ffffff', flex: 1 },
})