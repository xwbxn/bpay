import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Avatar, Button, Icon, ListItem, useTheme, Text, Divider, Input, Switch } from '@rneui/themed';

import { useMatrixClient } from '../../store/useMatrixClient';
import { IMemberItem, MemberList } from './components/MemberList';
import { IListItem } from './components/ListView';

export const RoomSetting = ({ navigation, route }) => {

    const { id } = route.params
    const { client } = useMatrixClient()
    const room = client.getRoom(id)
    const isFriendRoom = client.isFriendRoom(room.roomId)
    const { theme } = useTheme()
    const [roomMembers, setRoomMembers] = useState<IMemberItem[]>([])

    useEffect(() => {
        // set nav bar
        navigation.setOptions({
            title: `聊天设置`
        })
    }, [])

    useEffect(() => {
        setRoomMembers(room.getMembers().map(i => {
            return {
                id: i.userId,
                name: i.name,
                avatar: i.getAvatarUrl(client.baseUrl, 50, 50, 'crop', true, true)
            }
        }))
    }, [])

    const leaveGroup = () => {
        Alert.alert("确认", "是否要退出群聊?", [
            {
                text: '取消',
                onPress: () => console.log('Cancel Pressed'),
                style: 'cancel',
            },
            {
                text: '确认', onPress: async () => {
                    client.leave(room.roomId)
                    navigation.replace('Sessions')
                }
            },
        ])
    }

    const onMemberPress = (item: IListItem) => {
        navigation.push('Member', { userId: item.id, roomId: room.roomId })
    }

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: '#f5f5f5' },
        content: { backgroundColor: '#ffffff', marginBottom: 12, paddingHorizontal: 10 },
        listItem: { margin: 0, paddingVertical: 15 },
        listItemTitle: { fontSize: 20 },
        listItemText: { fontSize: 20, color: theme.colors.grey2 }
    })

    const groupSetting = <View style={styles.container}>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <MemberList containerStyle={{ paddingVertical: 20 }} items={roomMembers}
                onItemPress={onMemberPress}></MemberList>
        </View>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>群聊名称</ListItem.Title>
                </ListItem.Content>
                <Text style={styles.listItemText}>{room.name}</Text>
                <ListItem.Chevron></ListItem.Chevron>
            </ListItem>
            <Divider></Divider>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>群二维码</ListItem.Title>
                </ListItem.Content>
                <Icon size={20} name='qrcode' type='material-community' color={theme.colors.grey2}></Icon>
                <ListItem.Chevron></ListItem.Chevron>
            </ListItem>
            <Divider></Divider>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>群公告</ListItem.Title>
                </ListItem.Content>
                <Text style={styles.listItemText}>{'群公告'}</Text>
                <ListItem.Chevron></ListItem.Chevron>
            </ListItem>
            <Divider></Divider>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>备注</ListItem.Title>
                </ListItem.Content>
                <Text style={styles.listItemText}>{'备注'}</Text>
                <ListItem.Chevron></ListItem.Chevron>
            </ListItem>
        </View>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>查找聊天记录</ListItem.Title>
                </ListItem.Content>
                <ListItem.Chevron></ListItem.Chevron>
            </ListItem>
            <Divider></Divider>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>群文件</ListItem.Title>
                </ListItem.Content>
                <ListItem.Chevron></ListItem.Chevron>
            </ListItem>
        </View>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>消息免打扰</ListItem.Title>
                </ListItem.Content>
                <Switch style={{ height: 20 }}></Switch>
            </ListItem>
            <Divider></Divider>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>置顶聊天</ListItem.Title>
                </ListItem.Content>
                <Switch style={{ height: 20 }}></Switch>
            </ListItem>
        </View>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <ListItem containerStyle={styles.listItem} onPress={leaveGroup}>
                <ListItem.Content style={{ alignItems: 'center' }}>
                    <ListItem.Title style={{ ...styles.listItemTitle, color: theme.colors.error }}>退出群聊</ListItem.Title>
                </ListItem.Content>
            </ListItem>
        </View>
    </View >

    const friendSetting = <View style={styles.container}>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <MemberList containerStyle={{ paddingVertical: 20 }} onItemPress={onMemberPress}
                items={roomMembers.filter(i => i.id !== client.getUserId())}></MemberList>
        </View>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>查找聊天记录</ListItem.Title>
                </ListItem.Content>
                <ListItem.Chevron></ListItem.Chevron>
            </ListItem>
        </View>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>消息免打扰</ListItem.Title>
                </ListItem.Content>
                <Switch style={{ height: 20 }}></Switch>
            </ListItem>
            <Divider></Divider>
            <ListItem containerStyle={styles.listItem}>
                <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle}>置顶聊天</ListItem.Title>
                </ListItem.Content>
                <Switch style={{ height: 20 }}></Switch>
            </ListItem>
        </View>
    </View>

    return isFriendRoom ? friendSetting : groupSetting
}