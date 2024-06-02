import { View, StyleSheet } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { useCart } from '../../store/cartContext'
import BpayHeader from '../../components/BpayHeader'
import { createWalletOrder, getMyBalance } from '../../service/wordpress'
import { Button, Card, Divider, Image, ListItem, Text, Tile, useTheme } from '@rneui/themed'
import Toast from 'react-native-root-toast'
import { useGlobalState } from '../../store/globalContext'
import { useProfile } from '../../store/profileContext'

const Checkout = ({ navigation }) => {

    const { setLoading } = useGlobalState()
    const { refreshProfile } = useProfile()
    const cart = useCart()
    const [balance, setBalance] = useState('0')
    const { theme } = useTheme()

    useEffect(() => {
        getMyBalance().then(res => {
            setBalance(res.message.balance)
        })
    }, [])

    const purchase = useCallback(
        () => {
            if (parseFloat(balance) < cart.getTotal()) {
                Toast.show('余额不足', { position: Toast.positions.CENTER })
                return
            }
            const data = cart.items.map(item => ({ product_id: parseInt(item.id), quantity: item.quantity }))
            setLoading(true)
            createWalletOrder({ line_items: data }).then(res => {
                if (res.result) {
                    Toast.show('购买成功', { position: Toast.positions.CENTER })
                    refreshProfile()
                    navigation.goBack()
                } else {
                    Toast.show(res.message, { position: Toast.positions.CENTER })
                }
                setLoading(false)
            }).catch(res => {
                Toast.show(JSON.stringify(res), { position: Toast.positions.CENTER })
                setLoading(false)
            })
        },
        [balance],
    )


    return (
        <View style={styles.container}>
            <BpayHeader title={`余额: DTC${balance}`} showback />
            <View style={styles.content}>
                <ListItem>
                    <Text h4>购物车:</Text>
                </ListItem>
                {cart.items.map(item => <ListItem key={item.id} bottomDivider>
                    <Image source={{ uri: item.image }} containerStyle={{ width: 60, height: 60 }} width={60} height={60}></Image>
                    <ListItem.Content>
                        <ListItem.Title numberOfLines={1}>{item.name}</ListItem.Title>
                        <ListItem.Subtitle>DTC: {item.price}</ListItem.Subtitle>
                    </ListItem.Content>
                    <ListItem.Subtitle>数量: {item.quantity}</ListItem.Subtitle>
                </ListItem>)}
                <Divider style={{ backgroundColor: '#f5f5f5', height: 5 }}></Divider>
                <ListItem>
                    <Text h4>总计:</Text>
                </ListItem>
                <ListItem>
                    <ListItem.Content>
                        <ListItem.Title>积分：</ListItem.Title>
                    </ListItem.Content>
                    <ListItem.Subtitle>DTC: {cart.getTotal()}</ListItem.Subtitle>
                </ListItem>
                <View style={styles.buttonContainer}>
                    <Button containerStyle={{ width: '45%' }} title={'取消'} type='outline' color={theme.colors.error} onPress={() => {
                        cart.setCartItem([])
                        navigation.goBack()
                    }}></Button>
                    <Button containerStyle={{ width: '45%' }} title='兑换' onPress={purchase} />
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { backgroundColor: '#ffffff', flex: 1 },
    buttonContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', paddingTop: 20 },
})

export default Checkout