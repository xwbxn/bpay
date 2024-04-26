import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import { Icon, useTheme } from '@rneui/themed'
import { globalStyle } from '../../../utils/styles'
import { useNavigation } from '@react-navigation/native'
import BpayHeader from '../../../components/BpayHeader'



export default function PostHeader(opts) {
    const { leftComponent = null } = opts
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
        <BpayHeader
            leftComponent={leftComponent}
            centerComponent={<View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                <TouchableOpacity><Text style={[styles.headTitle, globalStyle.headTitleFontStyle]}>首页</Text></TouchableOpacity>
                <TouchableOpacity><Text style={[styles.headTitle, globalStyle.headTitleFontStyle]}>视频</Text></TouchableOpacity>
                <TouchableOpacity><Text style={[styles.headTitle, globalStyle.headTitleFontStyle]}>一对一</Text></TouchableOpacity>
            </View>}
            rightComponent={<Icon iconStyle={{ color: theme.colors.background }}
                name="search" type="font-awesome"></Icon>}
        ></BpayHeader>
    )
}