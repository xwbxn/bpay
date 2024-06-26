import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import * as Updates from 'expo-updates';

import { Avatar, Badge, Icon, Text, useTheme, Switch, Chip } from '@rneui/themed';

import BpayHeader from '../../components/BpayHeader';
import { useGlobalState } from '../../store/globalContext';
import { useProfile } from '../../store/profileContext';
import { useMatrixClient } from '../../store/useMatrixClient';
import { normalizeUserId } from '../../utils';
import { CardView } from '../../components/CardView';
import { IPropEditorProps, PropEditor } from '../../components/PropEditor';
import { ISettingItem, SettingList } from '../../components/SettingList';
import Toast from 'react-native-root-toast';
import { getMyBalance } from '../../service/wordpress';
import { PushRuleKind } from 'matrix-js-sdk';
import { ScrollView } from 'react-native';

const Profile = ({ navigation, route }) => {

    const { setLoading } = useGlobalState()
    const { theme } = useTheme()
    const { client } = useMatrixClient()

    const [editProps, setEditProps] = useState<IPropEditorProps>({ isVisible: false, props: {} })
    const { profile, logout, setProfile } = useProfile()
    const [balance, setBalance] = useState('0')
    const [silence, setSilence] = useState(client.pushRules.global.override.find(r => r.rule_id === '.m.rule.master').enabled)
    const [newVersion, setNewVersion] = useState(false)


    useEffect(() => {
        getMyBalance().then(res => {
            setBalance(res.message.balance)
        })
        Updates.checkForUpdateAsync().then(res => {
            if (res.isAvailable) {
                setNewVersion(true)
            }
        })
    }, [])


    // 设置我的头像
    const setMyAvatar = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 4],
            quality: 1,
        });
        if (!result.canceled) {
            result.assets.forEach(async (a) => {
                const upload = await client.uploadFile({
                    uri: a.uri,
                    name: a.fileName,
                    mimeType: a.mimeType
                })
                const avatar_url = client.mxcUrlToHttp(upload.content_uri, 80, 80, 'scale', true, true)
                await client.setAvatarUrl(avatar_url)
                setProfile({
                    avatar: avatar_url
                })
            })
        }
    }

    // 设置我的昵称
    const setMyNickName = () => {
        setEditProps({
            isVisible: true,
            title: '设置昵称',
            props: {
                name: {
                    value: profile?.name,
                    title: '昵称'
                },
            },
            onSave(data) {
                setLoading(true)
                client.setDisplayName(data.name.value).then(() => {
                    setProfile({
                        name: data.name.value
                    })
                    setEditProps({ isVisible: false })
                }).finally(() => {
                    setLoading(false)
                })
            },
            onCancel() {
                setEditProps({ isVisible: false })
            },
        })
    }

    // 登出
    const logOut = async () => {
        await logout()
        client.stopClient()
        navigation.popToTop()
        navigation.replace('Welcome')
    }

    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1, backgroundColor: '#f5f5f5' },
        content: { backgroundColor: '#ffffff', marginBottom: 12, paddingHorizontal: 10 },
        listItem: { margin: 0, paddingVertical: 15 },
        listItemTitle: { fontSize: 20 },
        listItemText: { fontSize: 20, color: theme.colors.grey2 }
    }), [theme])

    const mySettingItems: ISettingItem[] = [
        {
            title: 'DTC余额',
            text: `${balance} DTC`,
            onPress: () => navigation.push('transaction')
        },
        {
            title: '我的订单',
            onPress: () => navigation.push('Orders')
        },
        {
            title: '设置昵称',
            onPress: profile.authenticated && setMyNickName,
            text: profile.authenticated && profile?.name,
            breakTop: true
        },
        {
            title: '设置头像',
            onPress: profile.authenticated && setMyAvatar,
            right: () => profile.authenticated && <Avatar size={24} source={{ uri: profile?.avatar }}></Avatar>
        },
        {
            title: '我的二维码',
            right: () => <Icon size={20} name='qrcode' type='material-community' color={theme.colors.grey2}></Icon>,
            onPress: () => profile.authenticated && navigation.push('Qrcode', { uri: client.getUserId() })
        },
        {
            title: '我的收藏',
        },
        {
            title: '消息提醒',
            right: () => <Switch value={!silence} onValueChange={(value) => {
                client.setPushRuleEnabled('global', PushRuleKind.Override, '.m.rule.master', !value)
                setSilence(!value)
            }} style={{ height: 20 }}></Switch>,
        },
        {
            title: '清理缓存',
            onPress: () => {
                profile.authenticated && Alert.alert('确认', '清理缓存不会清除聊天记录，但附件需要重新下载。', [
                    { text: '取消' },
                    {
                        text: '确定', onPress: async () => {
                            setLoading(true)
                            await FileSystem.deleteAsync(FileSystem.cacheDirectory)
                            setLoading(false)
                            Toast.show('缓存清理成功')
                        }
                    }
                ])
            }
        },
        {
            title: '高级设置',
            onPress: () => navigation.push('AdvancedSetting'),
        },
        {
            title: '检查更新',
            onPress: async () => {
                try {
                    const update = await Updates.checkForUpdateAsync();

                    if (update.isAvailable) {
                        Alert.alert('提示', '有新的版本更新', [
                            { text: '取消', onPress: () => { } },
                            {
                                text: '更新', onPress: async () => {
                                    await Updates.fetchUpdateAsync()
                                    await Updates.reloadAsync();
                                    alert('更新成功')
                                }
                            },
                        ])
                    } else {
                        alert('已经是最新版本')
                    }
                } catch (error) {
                    alert(`检查更新出错: ${error}`);
                }
            },
            right: () => <Chip size='sm' color={newVersion ? 'error' : 'success'}>{newVersion ? '有新版本' : '已是最新'}</Chip>
        },
        {
            title: '修改密码',
            breakTop: true,
            onPress: () => navigation.push('UpdatePassword'),
            titleStyle: { color: theme.colors.primary, alignItems: 'center' },
            titleContainerStyle: { alignItems: 'center' },
            hideChevron: true,
            hidden: !profile.authenticated
        },
        {
            title: '退出登录',
            onPress: logOut,
            breakTop: true,
            titleStyle: { color: theme.colors.error, alignItems: 'center' },
            titleContainerStyle: { alignItems: 'center' },
            hideChevron: true,
            hidden: !profile.authenticated
        }
    ]

    const membership = useMemo(() => {
        if (profile.membership_level) {
            return <View style={{ backgroundColor: theme.colors.primary, padding: 6, borderRadius: 10 }}>
                <Pressable onPress={() => navigation.push('Membership')}>
                    <Text style={{ color: theme.colors.background, fontWeight: 'bold' }}>{profile.membership_level.name}</Text>
                </Pressable>
            </View>
        }
        return null
    }, [profile, theme])
    const defaultAvatar = require('../../assets/avatars/default.png')
    const mySetting = (<View style={styles.container}>
        {profile.authenticated ?
            <CardView title={profile?.name} subTittle={normalizeUserId(profile?.matrixAuth?.user_id)}
                avatar={profile?.avatar} right={membership}
                onAvatarPress={setMyAvatar} />
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
        <ScrollView>
            {mySetting}
        </ScrollView>
    </>
}

export default Profile