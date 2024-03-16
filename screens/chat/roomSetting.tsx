import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Avatar, Button, Icon, ListItem, useTheme, Text, Divider, Input } from '@rneui/themed';

import { useMatrixClient } from '../../store/useMatrixClient';

export const RoomSetting = ({ navigation, route }) => {

    const { id } = route.params
    const { client } = useMatrixClient()
    const room = client.getRoom(id)
    const { theme } = useTheme()
    const { width } = useWindowDimensions()
    const [contactVisible, setContactVisible] = useState(false)

    useEffect(() => {
        // set nav bar
        navigation.setOptions({
            title: `聊天设置`
        })
    }, [])

    const inviteToGroup = () => {
    }

    const leaveGroup = () => {
        client.leave(room.roomId).then(() => {
            navigation.replace('Sessions')
        })
    }

    const dismissGroup = () => {

    }

    return <View style={styles.container}>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            <ListItem>
                <ListItem.Content>
                    <Input value={room.roomId} label='群Id' readOnly></Input>
                    <Input value={room.name} label='群名称' readOnly></Input>
                </ListItem.Content>
                <Avatar title={'群'} size={width / 4} rounded
                    containerStyle={{
                        backgroundColor: theme.colors.primary,
                        marginBottom: 10,
                        marginTop: 20
                    }}></Avatar>
            </ListItem>
            <ListItem.Accordion content={<Text>群成员</Text>} isExpanded={contactVisible}
                onPress={() => setContactVisible(!contactVisible)}>
                {room.getMembers().filter(m => m.userId !== client.getUserId()).map(m => {
                    return <ListItem key={m.userId} topDivider>
                        <Avatar size={50} rounded title={m.name[0]}
                            containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
                        <ListItem.Content>
                            <ListItem.Title>{m.name}</ListItem.Title>
                            <ListItem.Subtitle style={{ color: theme.colors.grey3 }}>
                                {m.membership === 'invite' ? '已邀请等待同意' : '已加入聊天'}
                            </ListItem.Subtitle>
                        </ListItem.Content>
                        <ListItem.Chevron>{m.powerLevel}</ListItem.Chevron>
                    </ListItem>
                })}
            </ListItem.Accordion>

            <View style={{ paddingTop: 15, paddingHorizontal: 10 }}>
                <Button onPress={(inviteToGroup)}
                    title={"邀请加入"} ></Button>
            </View>
            <View style={{ paddingTop: 15, paddingHorizontal: 10 }}>
                <Button color={'warning'} onPress={leaveGroup}
                    title={"退出群组"} ></Button>
            </View>
            <View style={{ paddingTop: 15, paddingHorizontal: 10 }}>
                <Button color={'error'} title={'解散群组'} onPress={() => { dismissGroup() }}></Button>
            </View>
        </View>
    </View >
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { backgroundColor: '#ffffff', flex: 1, paddingHorizontal: 10 },
})