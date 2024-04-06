import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { Header, Icon, useTheme } from '@rneui/themed';

import { globalStyle } from '../utils/styles';

interface IBpayHeaderProps {
    leftComponent?: React.ReactElement
    rightComponent?: React.ReactElement
    centerComponent?: React.ReactElement
    title?: string
    showback?: boolean
}

export default function BpayHeader(opts: IBpayHeaderProps) {
    const { leftComponent = null, rightComponent = null, centerComponent = null, title, showback = false } = opts
    const { theme } = useTheme()
    const styles = StyleSheet.create({
        headTitle: {
            color: theme.colors.background,
            fontWeight: 'bold',
            marginHorizontal: 8
        }
    })
    const navigation = useNavigation()

    return (
        <Header
            leftContainerStyle={{ marginLeft: 6 }}
            rightContainerStyle={{ marginRight: 6 }}
            leftComponent={leftComponent ? leftComponent : (showback && <Icon name='arrow-back' color={theme.colors.background} onPress={() => navigation.goBack()}></Icon>)}
            centerComponent={centerComponent ? centerComponent : <Text style={[styles.headTitle, globalStyle.headTitleFontStyle]}>{title}</Text>}
            rightComponent={rightComponent ? rightComponent : null}
        ></Header >
    )
}