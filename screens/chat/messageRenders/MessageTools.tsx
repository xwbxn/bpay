import { View, Text } from 'react-native'
import React, { useEffect } from 'react'
import { Button, ButtonGroup, Icon } from '@rneui/themed'
import { IContent, MsgType } from 'matrix-js-sdk'
import { globalStyle } from '../../../utils/styles'

export default function MessageTools({ currentMessage, onContextPress, onClose, onLayout }) {
    const content: IContent = currentMessage?.event?.getContent()
    const options = [
        { code: 'forward', name: '转发', icon: 'share', type: 'font-awesome-5' },
        { code: 'favorite', name: '收藏', icon: 'favorite' },
        { code: 'redact', name: '撤回', icon: 'delete' }]
    if (content?.msgtype === MsgType.Text) {
        options.unshift({ code: 'copy', name: '复制', icon: 'copy', type: 'font-awesome-5' })
    }

    useEffect(() => {
        // onLayout({
        //     nativeEvent: {
        //         layout: {
        //             height: 60,
        //             width: 60 * options.length
        //         }
        //     }
        // })
    }, [])


    const onPress = (code) => {
        onClose()
        onContextPress && onContextPress(code, currentMessage)
    }

    return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
            {options.map(i => {
                return <Button
                    iconPosition='top'
                    key={i.code}
                    onPress={() => onPress(i.code)}
                    titleStyle={{ color: '#fff', fontSize: globalStyle.subTitleFontStyle.fontSize }}
                    icon={<Icon name={i.icon} color={'#fff'} type={i.type}></Icon>}
                    title={i.name} type='clear'
                    size='sm' containerStyle={{ marginHorizontal: 8 }}></Button>
            })}
        </View>
    )
}