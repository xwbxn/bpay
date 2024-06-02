import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Avatar, Icon, Text, useTheme } from '@rneui/themed';

import BpayHeader from '../../components/BpayHeader';
import { useGlobalState } from '../../store/globalContext';
import { useProfile } from '../../store/profileContext';
import { useMatrixClient } from '../../store/useMatrixClient';
import { normalizeUserId } from '../../utils';
import { CardView } from '../../components/CardView';
import { IPropEditorProps, PropEditor } from '../../components/PropEditor';
import { ISettingItem, SettingList } from '../../components/SettingList';
import Toast from 'react-native-root-toast';

const AdvProfile = ({ navigation, route }) => {

    const { setLoading } = useGlobalState()
    const { theme } = useTheme()
    const { client } = useMatrixClient()

    const [editProps, setEditProps] = useState<IPropEditorProps>({ isVisible: false, props: {} })
    const { profile, logout, setProfile } = useProfile()

    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1, backgroundColor: '#f5f5f5' },
        content: { backgroundColor: '#ffffff', marginBottom: 12, paddingHorizontal: 10 },
        listItem: { margin: 0, paddingVertical: 15 },
        listItemTitle: { fontSize: 20 },
        listItemText: { fontSize: 20, color: theme.colors.grey2 }
    }), [theme])

    const mySettingItems: ISettingItem[] = [
        {
            title: '调试信息',
            onPress: () => navigation.push('DebugInfo')
        },
        {
            title: '删除账户',
            onPress: () => navigation.push('DeleteProfile'),
            breakTop: true,
            titleStyle: { color: theme.colors.error, alignItems: 'center' },
            titleContainerStyle: { alignItems: 'center' },
            hideChevron: true,
            hidden: !profile.authenticated
        }
    ]

    const defaultAvatar = require('../../assets/avatars/default.png')
    const mySetting = (<View style={styles.container}>
        {profile.authenticated ?
            <CardView title={profile?.name} subTittle={normalizeUserId(profile?.matrixAuth?.user_id)}
                avatar={profile?.avatar} />
            :
            <CardView title='登录/注册' onPress={() => navigation.push('Login')}
                subTittle={<Text>立即登录, 体验BPay生活</Text>}
                avatar={defaultAvatar} avatarStyle={{ opacity: 0.8, tintColor: 'lightgrey' }}
            />}
        {<SettingList items={mySettingItems}></SettingList>}
    </View >)

    return <>
        <BpayHeader showback title='用户信息'></BpayHeader>
        <PropEditor editProps={editProps}></PropEditor>
        {mySetting}
    </>
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { backgroundColor: '#ffffff' },
})

export default AdvProfile