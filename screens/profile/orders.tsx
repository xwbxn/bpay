import { View, Text, StyleSheet, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import BpayHeader from '../../components/BpayHeader'
import { getOrders } from '../../service/wordpress'
import { ListItem } from '@rneui/themed'
import moment from 'moment'
import { useGlobalState } from '../../store/globalContext'

const STATUS_MAP = {
    'pending': '待付款',
    'processing': '正在处理',
    'completed': '已完成',
    'cancelled': '已取消',
    'refunded': '已退款',
    'on-hold': '待收款'
}

const Orders = () => {

    const [orders, setOrders] = useState([])
    const { setLoading } = useGlobalState()

    useEffect(() => {
        setLoading(true)
        getOrders().then(res => {
            if (res.result) {
                setOrders(res.message)
            }
            setLoading(false)
        })
    }, [])


    return (
        <View style={styles.container}>
            <BpayHeader showback title='我的订单'></BpayHeader>
            <ScrollView style={styles.content}>
                {orders.map(order => <ListItem key={order.id} bottomDivider>
                    <ListItem.Content>
                        <ListItem.Title>{moment(order.date_created).format('YYYY-MM-DD hh:mm')}</ListItem.Title>
                        <ListItem.Title>订单号: {order.id}</ListItem.Title>
                        <ListItem.Subtitle>{order.line_items.map(i => `${i.name} × ${i.quantity}`).join(' ')}</ListItem.Subtitle>
                    </ListItem.Content>
                    <ListItem.Content right>
                        <ListItem.Subtitle>总金额: {order.total}</ListItem.Subtitle>
                        <ListItem.Subtitle>状态: {STATUS_MAP[order.status] || order.status}</ListItem.Subtitle>
                    </ListItem.Content>

                </ListItem>)}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { backgroundColor: '#ffffff', flex: 1 },
})

export default Orders