import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import { Icon, useTheme } from '@rneui/themed'
import { globalStyle } from '../../../utils/styles'
import { useNavigation } from '@react-navigation/native';
import BpayHeader from '../../../components/BpayHeader'



export default function PostHeader(opts) {
    const { leftComponent = null, showback = false, rightComponent = null } = opts
    const { theme } = useTheme()
    const navigation = useNavigation()
    const styles = StyleSheet.create({
        headTitle: {
            color: theme.colors.background,
            fontWeight: 'bold',
            marginHorizontal: 8
        }
    })

    return (
        <BpayHeader
            leftComponent={leftComponent} showback={showback}
            centerComponent={<View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                <TouchableOpacity
                    //@ts-ignore
                    onPress={() => { navigation.navigate('Squire') }}><Text style={[styles.headTitle, globalStyle.headTitleFontStyle]}>广场</Text>
                </TouchableOpacity>
                <TouchableOpacity><Text style={[styles.headTitle, globalStyle.headTitleFontStyle]}>视频</Text></TouchableOpacity>
                <TouchableOpacity><Text style={[styles.headTitle, globalStyle.headTitleFontStyle]}>一对一</Text></TouchableOpacity>
            </View>}
            rightComponent={rightComponent || <Icon iconStyle={{ color: theme.colors.background }}
                name="search" type="feather"></Icon>}
        ></BpayHeader>
    )
}