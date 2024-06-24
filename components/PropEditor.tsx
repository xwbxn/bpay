import React, { useEffect, useState } from 'react';
import { SafeAreaView, View } from 'react-native';

import { Button, Dialog, Header, Input, Overlay, Text, useTheme } from '@rneui/themed';
import BpayHeader from './BpayHeader';
import { globalStyle } from '../utils/styles';

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
        overlayStyle={{ padding: 0, marginTop: 300 }} >
        <BpayHeader rightComponent={<Button buttonStyle={{ padding: 5 }} title={'确定'}
            onPress={() => { editProps.onSave && editProps.onSave(data) }}></Button>}
            leftComponent={<Button buttonStyle={{ padding: 5 }}
                onPress={() => { editProps.onCancel && editProps.onCancel() }} title={'取消'}></Button>}
        ></BpayHeader>
        <View style={{ alignItems: 'center', padding: 20 }}>
            <Text style={[globalStyle.headTitleFontStyle, { fontWeight: 'bold' }]}>{editProps.title}</Text>
        </View>
        {Object.keys(data).map(i => {
            return <View style={{ padding: 10 }} key={i}>
                <Text style={[{ marginLeft: 16, marginBottom: 6 }, globalStyle.titleFontStyle,]}>{data[i].title}</Text>
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