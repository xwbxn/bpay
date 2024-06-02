import { View, Text, StyleSheet } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import BpayHeader from '../../components/BpayHeader'
import { ListItem, useTheme } from '@rneui/themed'
import { getMyBalance, getMyTransations } from '../../service/wordpress'
import { useGlobalState } from '../../store/globalContext'
import Toast from 'react-native-root-toast'

function Transations() {

    const { setLoading } = useGlobalState()
    const [transacations, setTransacations] = useState([])
    const [balance, setBalance] = useState("0")

    useEffect(() => {
        setLoading(true)
        getMyBalance().then(res => {
            setBalance(res.message.balance)
            return Promise.resolve()
        }).then(res => {
            getMyTransations().then(res => {
                setTransacations(res.message)
            })
        }).catch(err => {
            Toast.show(err?.message)
        }).finally(() => {
            setLoading(false)
        })

    }, [])

    const transationList = useMemo(() => {
        if (transacations.length == 0) {
            return <ListItem>
                <ListItem.Content>
                    <ListItem.Title>暂无记录</ListItem.Title>
                </ListItem.Content>
            </ListItem>
        }

        return transacations.map(item => {
            const color = item.type === 'debit' ? "green" : "red"
            const symbol = item.type === 'debit' ? "-" : "+"
            return <ListItem key={item.transaction_id} bottomDivider>
                <ListItem.Content>
                    <ListItem.Title>{item.details || (item.type === 'dept' ? '转出' : '转入')}</ListItem.Title>
                    <ListItem.Subtitle>{item.date}</ListItem.Subtitle>
                </ListItem.Content>
                <ListItem.Content right>
                    <ListItem.Title style={{ color: color }}>{symbol}{parseFloat(item.amount).toFixed(2)}</ListItem.Title>
                    <ListItem.Subtitle>余额: {parseFloat(item.balance).toFixed(2)}</ListItem.Subtitle>
                </ListItem.Content>
            </ListItem>
        })
    }, [transacations])

    return <>
        <BpayHeader showback title='积分记录'></BpayHeader>
        <View style={styles.container}>
            <Text style={styles.balance}>当前余额: {parseFloat(balance).toFixed(2)}</Text>
        </View>
        <ListItem.Accordion isExpanded content={<ListItem.Content><ListItem.Title>交易记录</ListItem.Title></ListItem.Content>}>
            {transationList}
        </ListItem.Accordion>
    </>
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 20,
        paddingLeft: 12,
        backgroundColor: '#fff'
    },
    balance: {
        fontSize: 24,
        fontWeight: 'bold'
    }
})

export default Transations