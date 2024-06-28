import { Avatar, Icon, ListItem, useTheme } from '@rneui/themed'
import React, { ReactElement } from 'react'
import { View, StyleSheet, Text, ImageStyle, Pressable, TouchableWithoutFeedback, TouchableOpacity } from 'react-native'
import { globalStyle } from '../utils/styles'
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-root-toast';
import { Image } from 'expo-image';


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
                ? <Pressable onPress={() => { onAvatarPress && onAvatarPress() }}>
                    <Image source={typeof (avatar) === 'number' ? avatar : { uri: avatar }} style={{ height: 60, width: 60, borderRadius: 5 }}></Image>
                </Pressable>
                : <TouchableOpacity onPress={() => onAvatarPress && onAvatarPress()} style={{ height: 60, width: 60, borderRadius: 5, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: theme.colors.background, fontSize: 60 * 0.6, fontWeight: 'bold' }}>{title && title[0].toUpperCase()}</Text>
                </TouchableOpacity>}
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