import { ListItem, useTheme, Text, Divider } from '@rneui/themed'
import React, { ReactElement } from 'react'
import { ReactNode } from 'react'
import { StyleProp, View, ViewStyle, StyleSheet, TextStyle } from 'react-native'

export interface ISettingItem {
    title: string
    text?: string
    textStyle?: StyleProp<TextStyle>
    titleStyle?: StyleProp<TextStyle>
    titleContainerStyle?: StyleProp<ViewStyle>
    right?: () => React.JSX.Element
    onPress?: () => void,
    breakTop?: boolean,
    hideChevron?: boolean
}

interface ISettingList {
    containerStyle?: StyleProp<ViewStyle>
    listItemStyle?: StyleProp<ViewStyle>
    items: ISettingItem[]
}

export const SettingList = (opts: ISettingList) => {
    const { containerStyle, listItemStyle, items } = opts

    const { theme } = useTheme()
    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: '#f5f5f5' },
        content: { backgroundColor: '#ffffff', paddingHorizontal: 10 },
        defaultListItem: { margin: 0, paddingVertical: 14 },
        defaultListItemTitle: { fontSize: 20 },
        defaultListItemText: { fontSize: 20, color: theme.colors.grey2 }
    })

    return <>
        {items.map((i, index) =>
            <View key={index}>
                <ListItem topDivider={index !== 0 && !i.breakTop}
                    containerStyle={[
                        styles.content,
                        { backgroundColor: theme.colors.background, paddingHorizontal: 20, marginTop: i.breakTop ? 12 : 0 },
                        styles.defaultListItem,
                        listItemStyle]}
                    onPress={() => { i.onPress && i.onPress() }}>
                    <ListItem.Content style={i.titleContainerStyle}>
                        <ListItem.Title style={[styles.defaultListItemTitle, i.titleStyle]}>{i.title}</ListItem.Title>
                    </ListItem.Content>
                    {!i.right && !!i.text && <Text style={[styles.defaultListItemText, i.textStyle]}>{i.text}</Text>}
                    {!!i.right ? <i.right></i.right> : (!i.hideChevron && <ListItem.Chevron></ListItem.Chevron>)}
                </ListItem>
            </View>
        )}
    </>
}

