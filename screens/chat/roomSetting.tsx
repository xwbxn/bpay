import { Avatar, Button, Divider, Icon, ListItem, useTheme } from '@rneui/themed'
import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { useMatrixClient } from '../../store/chat'

export const RoomSetting = ({ navigation, route }) => {

    const { id } = route.params
    const { rooms, client } = useMatrixClient()
    const room = rooms.find(v => v.roomId === id)
    const { theme } = useTheme()

    useEffect(() => {
        // set nav bar
        navigation.setOptions({
            title: `聊天设置`
        })
    }, [])

    const leave = () => {
        client.leave(room.roomId).then(() => {
            navigation.replace('Sessions')
        }).catch(e => {
            console.log('e', e)
        })
    }

    return <View style={styles.container}>
        <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
            {room.getMembers().filter(m => m.userId !== client.getUserId()).map(m => {
                return <ListItem key={m.userId} topDivider>
                    <Avatar size={50} rounded title={m.name[0]} containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
                    <ListItem.Content>
                        <ListItem.Title>{m.name}</ListItem.Title>
                        <ListItem.Subtitle style={{ color: theme.colors.grey3 }}>{m.membership === 'invite' ? '已邀请等待同意' : '已加入聊天'}</ListItem.Subtitle>
                    </ListItem.Content>
                    <ListItem.Chevron></ListItem.Chevron>
                </ListItem>
            })}

            <View style={{ paddingTop: 10, paddingHorizontal: 10 }}>
                <Button icon={<Icon name='plus' type='entypo' color={theme.colors.primary}></Icon>}
                    title={"邀请加入聊天"} type='outline'></Button>
            </View>
            <View style={{ paddingTop: 100, paddingHorizontal: 10 }}>
                <Button color={'error'} title={'离开聊天并清空聊天记录'} onPress={() => { leave() }}></Button>
            </View>
        </View>
    </View >
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { backgroundColor: '#ffffff', flex: 1 },
})