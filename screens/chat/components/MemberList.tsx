import { Avatar, Icon, Text, useTheme } from '@rneui/themed'
import React, { useEffect, useRef, useState } from 'react'
import { LayoutChangeEvent, StyleProp, View, ViewStyle } from 'react-native'

export interface IMemberItem {
    id: string,
    name: string,
    avatar: string
}

interface IProps {
    items: IMemberItem[]
    containerStyle?: any
    onAppendPress?: () => void
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
    onAppendPress,
    onItemPress
}: IProps) => {

    const [width, setWidth] = useState(0)
    const { theme } = useTheme()

    const onLayout = (e: LayoutChangeEvent) => {
        setWidth(e.nativeEvent.layout.width)
    }

    return <>
        <View style={{ flexDirection: 'row', ...containerStyle }} onLayout={onLayout}>
            {items.map(i => <MemberItem key={i.id} width={width / 5}>
                {i.avatar
                    ? <Avatar onPress={() => { onItemPress && onItemPress(i) }} rounded size={(width / 5) - 16} containerStyle={{ backgroundColor: theme.colors.primary }} source={{ uri: i.avatar }}></Avatar>
                    : <Avatar onPress={() => { onItemPress && onItemPress(i) }} rounded size={(width / 5) - 16} containerStyle={{ backgroundColor: theme.colors.primary }} title={i.name[0]}></Avatar>}
                <Text style={{ color: theme.colors.grey3 }}>{i.name}</Text>
            </MemberItem>)}
            <MemberItem width={width / 5}>
                <Avatar size={(width / 5) - 16} rounded
                    icon={{ name: 'plus', type: 'simple-line-icon', color: theme.colors.primary, size: (width / 5) - 18 }}
                    containerStyle={{ backgroundColor: theme.colors.background }}></Avatar>
            </MemberItem>
            <MemberItem width={width / 5}>
                <Avatar size={(width / 5) - 16} rounded
                    icon={{ name: 'minus', type: 'simple-line-icon', color: theme.colors.primary, size: (width / 5) - 18 }}
                    containerStyle={{ backgroundColor: theme.colors.background }}></Avatar>
            </MemberItem>
        </View>
    </>
}