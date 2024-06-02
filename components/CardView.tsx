import { Avatar, Icon, ListItem, useTheme } from '@rneui/themed'
import React, { ReactElement } from 'react'
import { View, StyleSheet, Text, ImageStyle } from 'react-native'
import { globalStyle } from '../utils/styles'
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-root-toast';


interface IMemberCardProps {
    title: string | ReactElement
    subTittle?: string | ReactElement
    right?: ReactElement
    avatar?: string | number
    onAvatarPress?: () => void
    onPress?: () => void
    avatarStyle?: ImageStyle
}

export const CardView = (opts: IMemberCardProps) => {

    const { title, subTittle, avatar, onAvatarPress, onPress, avatarStyle, right } = opts
    const { theme } = useTheme()

    const onCopy = async () => {
        if (typeof (subTittle) === 'string') {
            await Clipboard.setStringAsync(subTittle);
            Toast.show('已复制到剪贴板', {
                position: Toast.positions.CENTER
            });
        }
    }

    return <View style={{ ...styles.content, backgroundColor: theme.colors.background }}>
        <ListItem onPress={() => onPress && onPress()}>
            {avatar
                ? <Avatar avatarStyle={avatarStyle} size={60} rounded source={typeof (avatar) === 'number' ? avatar : { uri: avatar }} onPress={() => { onAvatarPress && onAvatarPress() }}
                    containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
                : <Avatar avatarStyle={avatarStyle} size={60} rounded title={title && title[0].toUpperCase()} onPress={() => { onAvatarPress && onAvatarPress() }}
                    containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>}
            {subTittle ? <ListItem.Content style={{ height: 50, justifyContent: 'space-between' }}>
                {typeof (title) === 'object' ? title :
                    <ListItem.Title style={globalStyle.headTitleFontStyle}>{title}</ListItem.Title>}
                {<ListItem.Subtitle>
                    {typeof (subTittle) === 'object' ? subTittle :
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[globalStyle.subTitleFontStyle]}>{subTittle && 'ID:'} {subTittle}</Text>
                            {subTittle && <Icon onPress={onCopy} containerStyle={{ marginLeft: 4 }} name='copy' type='feather' size={14} ></Icon>}
                        </View>}
                </ListItem.Subtitle>}
            </ListItem.Content> :
                (typeof (title) === 'object' ? title :
                    <ListItem.Title style={globalStyle.headTitleFontStyle}>{title}</ListItem.Title>)}
            {right && right}
        </ListItem>
    </View>
}

const styles = StyleSheet.create({
    content: { backgroundColor: '#ffffff', marginBottom: 12, paddingHorizontal: 10 },
})