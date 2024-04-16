import { View, Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useMatrixClient } from '../../../store/useMatrixClient'
import { MatrixEvent, MsgType } from 'matrix-js-sdk'
import { normalizeUserId } from '../../../utils'
import { StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { Avatar } from '@rneui/themed'

export default function MessageRef({ eventId, position = 'left', width = undefined }) {

    const { client } = useMatrixClient()
    const [event, setEvent] = useState<MatrixEvent>()
    const [sender, setSender] = useState('')

    useEffect(() => {
        client.getEvent(eventId).then(evt => {
            if (evt) {
                setEvent(evt)
                const _sender = client.getUser(evt.getSender())
                if (_sender) {
                    setSender(_sender.displayName)
                } else {
                    setSender(normalizeUserId(evt.getSender()))
                }
            }
        })
    }, [])

    if (!event) {
        return null
    }

    const content = event.getContent()

    return (
        <View style={[styles.container, { width },
        position == 'left' ?
            { alignSelf: 'flex-start', marginRight: 52 } :
            { alignSelf: 'flex-end', marginLeft: 52 }]}>
            <Text style={styles.refText}>{sender}: </Text>
            {content.msgtype === MsgType.Text && <Text style={[styles.refText]} numberOfLines={3}>{content.body}</Text>}
            {content.msgtype === MsgType.Image && <Image source={{ uri: client.mxcUrlToHttp(content.info.thumbnail_url || content.url, 60, 60, 'scale', true, true) }} style={{ width: 60, height: 60 }} contentFit='contain'></Image>}
            {content.msgtype === MsgType.Video && <View>
                <Avatar containerStyle={{
                    position: 'absolute', zIndex: 9999,
                    justifyContent: 'center', height: 60, width: 60
                }} icon={{ name: 'play', type: 'octicon', color: '#a0a0a0', size: 30 }} size={30}></Avatar>
                <Image source={{ uri: client.mxcUrlToHttp(content.info.thumbnail_url, 60, 60, 'scale', true, true) }} style={{ width: 60, height: 60 }} contentFit='contain'></Image>
            </View>}
            {content.msgtype === MsgType.File && <Text style={styles.refText} numberOfLines={3}>文件:[{content.body}]</Text>}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 5,
        backgroundColor: '#f0f0f0'
    },
    refText: {
        color: 'grey',
    }
})