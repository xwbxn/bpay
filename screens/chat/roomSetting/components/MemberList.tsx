import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleProp, TouchableOpacity, View, ViewStyle, } from 'react-native';
import { Image } from 'expo-image';
import { Avatar, Icon, Text, useTheme } from '@rneui/themed';

export interface IMemberItem {
    id: string,
    name: string,
    avatar: string
}

interface IProps {
    items: IMemberItem[]
    containerStyle?: StyleProp<ViewStyle>
    onAppend?: () => void
    onDelete?: () => void
    onSetting?: () => void
    onItemPress?: (IMemberItem) => void
}

const MemberItem = ({ width, children }) => {
    return <View style={{ width: width, alignItems: 'center', marginBottom: 8 }}>
        {children}
    </View>
}

const DEFAULT_MEMBER_DISPLAY = 13

export const MemberList = ({
    items,
    containerStyle,
    onAppend,
    onDelete,
    onSetting,
    onItemPress
}: IProps) => {

    const [width, setWidth] = useState(0)
    const [itemWidth, setItemWidth] = useState(0)

    const { theme } = useTheme()
    const [filtedItems, setFiltedItems] = useState([])
    const [showMore, setShowMore] = useState(false)

    useEffect(() => {
        setFiltedItems([...items.slice(0, DEFAULT_MEMBER_DISPLAY)])
    }, [items])

    const onLayout = (e: LayoutChangeEvent) => {
        setWidth(e.nativeEvent.layout.width - 1)
        setItemWidth(Math.floor(e.nativeEvent.layout.width / 5) - 16)
    }

    return <View>
        <View style={[{ flexDirection: 'row', flexWrap: 'wrap' }, containerStyle]}
            onLayout={onLayout}>
            {filtedItems.map((i, index) => {
                return <MemberItem key={index} width={width / 5}>
                    {i.avatar
                        ? <Pressable onPress={() => onItemPress && onItemPress(i)}><Image source={{ uri: i.avatar }} style={{ width: itemWidth, height: itemWidth, borderRadius: 5 }}></Image></Pressable>
                        : <TouchableOpacity style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 5, backgroundColor: theme.colors.primary, width: itemWidth, height: itemWidth }} onPress={() => { onItemPress && onItemPress(i) }}>
                            <Text style={{ color: theme.colors.background, fontSize: itemWidth * 2 / 3, }}>{i.name[0]}</Text>
                        </TouchableOpacity>}
                    <Text style={{ color: theme.colors.grey3 }} numberOfLines={1} lineBreakMode='clip'>{i.name}</Text>
                </MemberItem>
            })}
            {onAppend && <MemberItem width={width / 5}>
                <Icon size={itemWidth - 4} onPress={() => { onAppend && onAppend() }} name={'plus'} type='antdesign'
                    color={theme.colors.primary}
                    containerStyle={{ borderWidth: 2, borderColor: theme.colors.primary, borderRadius: 5, borderStyle: 'dotted' }}></Icon>
            </MemberItem>}
            {onDelete && <MemberItem width={width / 5}>
                <Icon size={itemWidth - 4} onPress={() => { onDelete && onDelete() }} name='minus' type='antdesign'
                    color={theme.colors.primary}
                    containerStyle={{ borderWidth: 2, borderColor: theme.colors.primary, borderRadius: 5, borderStyle: 'dotted' }}></Icon>
            </MemberItem>}
            {onSetting && <MemberItem width={width / 5}>
                <Avatar size={itemWidth - 4} onPress={() => { onSetting && onSetting() }} title="···"
                    titleStyle={{ color: theme.colors.primary }}
                    containerStyle={{ borderWidth: 2, borderColor: theme.colors.primary, borderRadius: 5, borderStyle: 'dotted' }}></Avatar>
            </MemberItem>}
        </View>
        {items.length > 14 && <View style={{ alignItems: 'center' }}>
            <TouchableOpacity onPress={() => {
                if (showMore) {
                    setFiltedItems([...items.slice(0, DEFAULT_MEMBER_DISPLAY)])
                } else {
                    setFiltedItems([...items])
                }
                setShowMore(!showMore)
            }}><Text style={{ paddingBottom: 8, color: theme.colors.grey3 }}>{(showMore ? '收起' : '显示更多')}</Text></TouchableOpacity>
        </View>}
    </View>
}