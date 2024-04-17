import { View, Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import QRCode from 'react-native-qrcode-svg'
import BpayHeader from '../../components/BpayHeader';
import { useTheme } from '@rneui/themed';
import { useMatrixClient } from '../../store/useMatrixClient';


export default function Qrcode({ route }) {

    const { uri } = route.params || 'https://www.b-pay.life'
    const { client } = useMatrixClient()
    const { theme } = useTheme()
    let logoFromFile = require('../../assets/icon.png');
    const [title, setTitle] = useState('')
    const [headerTitle, setHeaderTitle] = useState('')

    useEffect(() => {
        if (uri.startsWith("@")) {
            setHeaderTitle('我的二维码')
            setTitle(client.getUser(uri)?.displayName)
        }
        if (uri.startsWith('!')) {
            setHeaderTitle('群二维码')
            setTitle(client.getRoom(uri)?.name)
        }
    }, [])


    return (
        <View>
            <BpayHeader title={headerTitle} showback></BpayHeader>
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
                <QRCode
                    size={200}
                    value={uri}
                    logo={logoFromFile}
                    color={theme.colors.primary}
                />
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                    <Text style={{ color: '#000', fontSize: 18 }}>{title}</Text>
                    <Text style={{ color: '#303030', fontSize: 14 }}>{uri}</Text>
                </View>
            </View>

        </View>
    )
}