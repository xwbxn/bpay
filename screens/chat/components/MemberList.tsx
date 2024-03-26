import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, TouchableOpacity, View, } from 'react-native';

import { Avatar, Text, useTheme } from '@rneui/themed';

export interface IMemberItem {
    id: string,
    name: string,
    avatar: string
}

interface IProps {
    items: IMemberItem[]
    containerStyle?: any
    onSetting?: () => void
    onItemPress?: (IMemberItem) => void
}

const MemberItem = ({ width, children }) => {

    return <View style={{ width: width, alignItems: 'center' }}>
        {children}
    </View>
}

export const MemberList = ({
    items,
    containerStyle,
    onSetting,
    onItemPress
}: IProps) => {

    const [width, setWidth] = useState(0)
    const { theme } = useTheme()
    const [filtedItems, setFiltedItems] = useState([])
    const [showMore, setShowMore] = useState(false)

    useEffect(() => {
        setFiltedItems([...items.slice(0, 14)])
    }, [items])

    const onLayout = (e: LayoutChangeEvent) => {
        setWidth(e.nativeEvent.layout.width)
    }

    return <View>
        <View style={{ flexDirection: 'row', ...containerStyle, flexWrap: 'wrap' }}
            onLayout={onLayout}>
            {filtedItems.map((i, index) => <MemberItem key={index} width={width / 5}>
                {i.avatar
                    ? <Avatar onPress={() => { onItemPress && onItemPress(i) }} rounded size={(width / 5) - 16} containerStyle={{ backgroundColor: theme.colors.primary }} source={{ uri: i.avatar }}></Avatar>
                    : <Avatar onPress={() => { onItemPress && onItemPress(i) }} rounded size={(width / 5) - 16} containerStyle={{ backgroundColor: theme.colors.primary }} title={i.name[0]}></Avatar>}
                <Text style={{ color: theme.colors.grey3 }}>{i.name}</Text>
            </MemberItem>)}
            <MemberItem width={width / 5}>
                <Avatar size={(width / 5) - 16} rounded onPress={() => { onSetting && onSetting() }}
                    title="···"
                    titleStyle={{ color: theme.colors.primary, fontSize: 20, fontWeight: 'bold' }}
                    containerStyle={{
                        backgroundColor: theme.colors.background,
                        borderWidth: 2, borderColor: theme.colors.primary,
                    }}>
                </Avatar>
            </MemberItem>
        </View>
        {items.length > 14 && <View style={{ alignItems: 'center' }}>
            <TouchableOpacity onPress={() => {
                if (showMore) {
                    setFiltedItems([...items.slice(0, 14)])
                } else {
                    setFiltedItems([...items])
                }
                setShowMore(!showMore)
            }}><Text style={{ paddingBottom: 8, color: theme.colors.grey3 }}>{(showMore ? '收起' : '显示更多')}</Text></TouchableOpacity>
        </View>}
    </View>
}