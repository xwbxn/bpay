import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button, Dialog, Header, Input, Overlay, Text, useTheme } from '@rneui/themed';

export interface IPropEditorProps {
    isVisible?: boolean,
    title?: string,
    props?: {
        [id: string]: {
            value: string,
            title: string
        }
    },
    onSave?: (props: {
        [id: string]: {
            value: string,
            title: string
        }
    }) => void,
    onCancel?: () => void
}

export const PropEditor = (props: {
    editProps: IPropEditorProps
}) => {

    const { editProps } = props
    const [data, setData] = useState({})
    const { theme } = useTheme()

    useEffect(() => {
        setData(editProps.props || {})
    }, [editProps.props])


    return <Overlay fullScreen isVisible={editProps.isVisible}
        overlayStyle={{ padding: 0 }} >
        <Header containerStyle={{ height: 55 }}
            rightComponent={<Button buttonStyle={{ padding: 5 }} title={'确定'}
                onPress={() => { editProps.onSave && editProps.onSave(data) }}></Button>}
            leftComponent={<Button buttonStyle={{ padding: 5 }} onPress={() => { editProps.onCancel && editProps.onCancel() }} title={'取消'}></Button>}
        ></Header>
        <View style={{ alignItems: 'center', padding: 20 }}><Text h3>{editProps.title}</Text></View>
        {Object.keys(data).map(i => {
            return <View style={{ padding: 10 }} key={i}>
                <Dialog.Title titleStyle={{ marginLeft: 15 }} title={data[i].title}></Dialog.Title>
                <Input style={{
                    backgroundColor: theme.colors.grey5,
                    fontSize: 18,
                    padding: 15, borderRadius: 5
                }} inputContainerStyle={{ borderBottomWidth: 0 }}
                    value={data[i].value}
                    onChangeText={(text) => {
                        data[i].value = text
                        setData({ ...data })
                    }}
                ></Input>
            </View>
        })}
    </Overlay>
}