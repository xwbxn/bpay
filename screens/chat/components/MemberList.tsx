import React, { useState } from 'react';
import { LayoutChangeEvent, View, } from 'react-native';

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
    </>
}