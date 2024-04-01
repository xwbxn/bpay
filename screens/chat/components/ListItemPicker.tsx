import { View, ScrollView } from 'react-native'
import React from 'react'
import { IListItem, ListView } from './ListView'
import { Button, Header, Overlay, useTheme } from '@rneui/themed'

interface IListItemPickerProps {
    isVisible: boolean
    items: IListItem[]
    selectedValues?: string[]
    allowRemove?: boolean
    searchVal?: string
    onOk?: () => void
    onCancel?: () => void
}

export default function ListItemPicker(opts: IListItemPickerProps) {

    const { isVisible, items, selectedValues, allowRemove, searchVal, onOk, onCancel } = opts
    const { theme } = useTheme()

    return (
        <Overlay isVisible={isVisible} overlayStyle={{ padding: 0 }} fullScreen={true}>
            <Header containerStyle={{ height: 60 }} leftComponent={{ icon: 'arrow-left', type: 'material-community', onPress: () => onCancel && onCancel(), iconStyle: { color: theme.colors.background } }}
                centerComponent={{ text: '设置管理员', style: { fontSize: 20, color: theme.colors.background, fontWeight: 'bold' } }}></Header>
            <View style={{ flex: 1, paddingHorizontal: 10 }}>
                <ScrollView>
                    <ListView allowRemove={allowRemove}
                        items={items}
                        search={searchVal}
                        selectedValues={selectedValues}
                        enableSelect multiSelect></ListView>
                </ScrollView>
            </View>
            <Button containerStyle={{ padding: 10 }} title={'确定'} onPress={() => {
                onOk && onOk()
            }}></Button>
        </Overlay >
    )
}