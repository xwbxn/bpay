import { ListItem, useTheme, Text, Divider } from '@rneui/themed'
import React, { ReactElement } from 'react'
import { ReactNode } from 'react'
import { StyleProp, View, ViewStyle, StyleSheet, TextStyle } from 'react-native'
import { globalStyle } from '../../../utils/styles'

export interface ISettingItem {
    title: string
    subTitle?: string
    text?: string
    textStyle?: StyleProp<TextStyle>
    titleStyle?: StyleProp<TextStyle>
    subTitleStyle?: StyleProp<TextStyle>
    titleContainerStyle?: StyleProp<ViewStyle>
    right?: () => React.JSX.Element
    onPress?: () => void,
    breakTop?: boolean,
    hideChevron?: boolean,
    hidden?: boolean
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
        defaultListItemTitle: globalStyle.headTitleFontStyle,
        defaultListItemText: { ...globalStyle.headTitleFontStyle, color: theme.colors.grey2 },
        defaultListItemSubtitle: { ...globalStyle.subTitleFontStyle, color: theme.colors.grey2 }
    })

    return <View style={containerStyle}>
        {items.filter(i => !i.hidden).map((i, index) =>
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
                        {i.subTitle && <ListItem.Subtitle style={[styles.defaultListItemSubtitle, i.subTitleStyle]}>{i.subTitle}</ListItem.Subtitle>}
                    </ListItem.Content>
                    {!i.right && !!i.text && <Text style={[styles.defaultListItemText, i.textStyle]}>{i.text}</Text>}
                    {!!i.right ? <i.right></i.right> : (!i.hideChevron && <ListItem.Chevron></ListItem.Chevron>)}
                </ListItem>
            </View>
        )}
    </View>
}

