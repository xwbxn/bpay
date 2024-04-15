import { View, Text, Pressable } from 'react-native'
import React from 'react'
import { MessageText as GiftedMessageText } from 'react-native-gifted-chat'

export default function MessageText(opts) {
    return (
        <Pressable onLongPress={opts.onLongPress}>
            <GiftedMessageText {...opts}></GiftedMessageText>
        </Pressable>
    )
}