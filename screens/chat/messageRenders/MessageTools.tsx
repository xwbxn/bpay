import { View, } from 'react-native'
import React from 'react'
import { Button, ButtonGroup, Icon } from '@rneui/themed'

export interface IToolOption {
    code: string,
    name: string,
    icon: string,
    type?: string
}

export default function MessageTools({ options, onContextPress, onClose, width, position }
    : { options: IToolOption[], onContextPress: any, onClose: any, width: number, position: string | 'left' | 'right' }) {

    const onPress = (code) => {
        onClose()
        onContextPress && onContextPress(code)
    }

    return (
        <View style={{ alignItems: position === 'left' ? 'flex-start' : 'flex-end', width, paddingHorizontal: 40 }}>
            <ButtonGroup containerStyle={{ width: options.length * 60, height: 66, borderRadius: 10 }}
                buttonContainerStyle={{ backgroundColor: '#444444', padding: 0 }}
                buttons={options.map(i => <Button key={i.code} iconPosition='top' title={i.name} color='#444444' onPress={() => onPress(i.code)}
                    icon={{ name: i.icon, type: i.type, color: '#fff' }} size='sm' titleStyle={{ color: '#fff' }}></Button>)}></ButtonGroup>
        </View>
    )
}