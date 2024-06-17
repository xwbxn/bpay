import { Pressable } from 'react-native'
import React from 'react'
import { MessageText as GiftedMessageText } from 'react-native-gifted-chat'

const MessageText = (opts) => {

    return (
        <Pressable onLongPress={opts.onLongPress}>
            <GiftedMessageText {...opts} ></GiftedMessageText>
        </Pressable>
    )
}

export default MessageText