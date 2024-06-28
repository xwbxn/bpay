import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { Avatar, Header, Icon, useTheme } from '@rneui/themed';

import { globalStyle } from '../utils/styles';
import { useProfile } from '../store/profileContext'

interface IBpayHeaderProps {
    leftComponent?: React.ReactElement
    rightComponent?: React.ReactElement
    centerComponent?: React.ReactElement
    centerContainerStyle?: StyleProp<ViewStyle>
    title?: string
    showback?: boolean,
    onBack?: () => void,
}

export default function BpayHeader(opts: IBpayHeaderProps) {
    const { leftComponent = null,
        rightComponent = null,
        centerComponent = null,
        title, showback = false,
        onBack = null,
        centerContainerStyle = null } = opts
    const { theme } = useTheme()
    const styles = StyleSheet.create({
        headTitle: {
            color: theme.colors.background,
            fontWeight: 'bold',
            marginHorizontal: 8
        }
    })
    const navigation = useNavigation()
    const { profile } = useProfile()

    const defaultLeft = profile.authenticated && profile.avatar
        ? <Avatar rounded source={{ uri: profile.avatar }} size={24}
            //@ts-ignore
            onPress={() => navigation.navigate('Profile')}></Avatar>
        : <Icon iconStyle={{ color: theme.colors.background }}
            //@ts-ignore
            name="user" type="font-awesome" onPress={() => navigation.navigate('Profile')}></Icon>

    return (
        <Header
            leftContainerStyle={{ marginLeft: 6, marginTop: 4, maxWidth: 60 }}
            rightContainerStyle={{ marginRight: 6, maxWidth: 60 }}
            centerContainerStyle={centerContainerStyle}
            leftComponent={leftComponent ?
                leftComponent :
                (showback ?
                    <Icon name='arrow-back' color={theme.colors.background} onPress={() => onBack ? onBack() : navigation.goBack()}></Icon> :
                    defaultLeft)}
            centerComponent={centerComponent ? centerComponent : <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={[styles.headTitle, { fontSize: 16 }]}>{title}</Text></View>}
            rightComponent={rightComponent ? rightComponent : null}
        ></Header >
    )
}