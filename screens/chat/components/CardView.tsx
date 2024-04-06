import { Avatar, ListItem, useTheme } from '@rneui/themed'
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { globalStyle } from '../../../utils/styles'

interface IMemberCardProps {
    title: string
    subTittle?: string
    avatarUrl?: string
    onAvatarPress?: () => void
    onPress?: () => void
}

export const CardView = (opts: IMemberCardProps) => {

    const { title, subTittle, avatarUrl, onAvatarPress, onPress } = opts
    const { theme } = useTheme()

    return <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
        <ListItem onPress={() => onPress && onPress()}>
            {avatarUrl
                ? <Avatar size={60} rounded source={{ uri: avatarUrl }} onPress={() => { onAvatarPress && onAvatarPress() }}
                    containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
                : <Avatar size={60} rounded title={title && title[0].toUpperCase()} onPress={() => { onAvatarPress && onAvatarPress() }}
                    containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>}
            <ListItem.Content style={{ height: 50, justifyContent: 'space-between' }}>
                <ListItem.Title style={globalStyle.headTitleFontStyle}>{title}</ListItem.Title>
                <ListItem.Subtitle style={globalStyle.subTitleFontStyle}>{subTittle}</ListItem.Subtitle>
            </ListItem.Content>
        </ListItem>
    </View>
}

const styles = StyleSheet.create({
    content: { backgroundColor: '#ffffff', marginBottom: 12, paddingHorizontal: 10 },
})