import { View, ScrollView } from 'react-native'
import React from 'react'
import { IListItem, ListView } from './ListView'
import { Button, Header, Overlay, useTheme, Text } from '@rneui/themed'

interface IListItemPickerProps {
    title?: string,
    isVisible: boolean
    items: IListItem[]
    enableSelect?: boolean
    selectedValues?: string[]
    allowRemove?: boolean
    searchVal?: string
    onOk?: () => void
    onCancel?: () => void
}

export default function ListItemPicker(opts: IListItemPickerProps) {

    const { title, isVisible, items, selectedValues, allowRemove, searchVal, onOk, onCancel, enableSelect = true } = opts
    const { theme } = useTheme()

    return (
        <Overlay isVisible={isVisible} overlayStyle={{ padding: 0 }} fullScreen={true}>
            <Header containerStyle={{ height: 60 }} leftComponent={{ icon: 'arrow-left', type: 'material-community', onPress: () => onCancel && onCancel(), iconStyle: { color: theme.colors.background } }}
                centerComponent={{ text: title, style: { fontSize: 20, color: theme.colors.background, fontWeight: 'bold' } }}></Header>
            <View style={{ flex: 1, paddingHorizontal: 10 }}>
                <ScrollView>
                    {items.length > 0 ?
                        <ListView allowRemove={allowRemove}
                            items={items}
                            search={searchVal}
                            selectedValues={selectedValues}
                            enableSelect={enableSelect} multiSelect></ListView>
                        :
                        <View style={{ paddingVertical: 100, alignItems: 'center' }}>
                            <Text h3 h3Style={{color:theme.colors.disabled}}>没有信息了</Text>
                        </View>
                    }
                </ScrollView>
            </View>
            {onOk && <Button containerStyle={{ padding: 10 }} title={'确定'} onPress={() => {
                onOk && onOk()
            }}></Button>}
        </Overlay >
    )
}