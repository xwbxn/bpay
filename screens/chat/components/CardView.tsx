import { Avatar, ListItem, useTheme } from '@rneui/themed'
import React from 'react'
import { View, StyleSheet } from 'react-native'

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

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: '#f5f5f5' },
        content: { backgroundColor: '#ffffff', marginBottom: 12, paddingHorizontal: 10 },
        listItem: { margin: 0, paddingVertical: 15 },
        listItemTitle: { fontSize: 20 },
        listItemText: { fontSize: 20, color: theme.colors.grey2 }
    })

    return <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
        <ListItem onPress={() => onPress && onPress()}>
            {avatarUrl
                ? <Avatar size={80} rounded source={{ uri: avatarUrl }} onPress={() => { onAvatarPress && onAvatarPress() }}
                    containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
                : <Avatar size={80} rounded title={title && title[0].toUpperCase()} onPress={() => { onAvatarPress && onAvatarPress() }}
                    containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>}
            <ListItem.Content style={{ marginLeft: 10 }}>
                <ListItem.Title style={{ fontSize: 30 }}>{title}</ListItem.Title>
                <ListItem.Subtitle style={{ fontSize: 15 }}>{subTittle}</ListItem.Subtitle>
            </ListItem.Content>
        </ListItem>
    </View>
}