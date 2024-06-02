import { View, Text, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import BpayHeader from '../../components/BpayHeader'
import { PricingCard, useTheme } from '@rneui/themed'
import { getProducts } from '../../service/wordpress'
import { stripHtml } from "string-strip-html";
import { useProfile } from '../../store/profileContext'
import moment from 'moment'
import { useCart } from '../../store/cartContext'
import { useGlobalState } from '../../store/globalContext'


const Membership = ({ navigation }) => {

    const { profile, refreshProfile } = useProfile()
    const { setLoading } = useGlobalState()
    const [products, setProducts] = useState([])
    const { theme } = useTheme()
    const { setCartItem } = useCart()

    useEffect(() => {
        setLoading(true)
        getProducts().then(res => {
            if (res.result) {
                let _items = []
                for (const product of res.message) {
                    const level = product.meta_data?.find(p => p.key === '_membership_product_level')
                    if (level) {
                        _items.push({
                            id: product.id,
                            name: product.name,
                            description: stripHtml(product.description).result,
                            price: product.price,
                            level: level.value,
                            image: product.images[0]?.src
                        })
                    }
                }
                setProducts(_items.sort((a, b) => { return parseInt(a.level) - parseInt(b.level) }))
            }
            setLoading(false)
        })
    }, [])


    return (
        <View style={styles.container}>
            <BpayHeader showback title='我的会员'></BpayHeader>
            <View style={styles.content}>
                {products.map((item, index) => {
                    const isMyLevel = profile.membership_level.id === item.level
                    return <PricingCard
                        key={index}
                        containerStyle={{ margin: 10 }}
                        title={item.name}
                        color={isMyLevel ? theme.colors.secondary : theme.colors.primary}
                        price={`DTC ${item.price}`}
                        info={[`${item.description}`]}
                        onButtonPress={() => {
                            setCartItem([{
                                id: item.id,
                                name: item.name,
                                price: parseFloat(item.price),
                                quantity: 1,
                                image: item.image
                            }])
                            navigation.push('Checkout')
                        }}
                        button={isMyLevel ? { title: `已开通 ${profile.membership_level?.enddate ? moment(new Date(parseInt(profile.membership_level?.enddate) * 1000)).format("YYYY-MM-DD") + '到期' : ""}`, icon: 'check', disabled: true } : { title: '立即开通', icon: 'flight-takeoff' }} />
                })}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { backgroundColor: '#ffffff', flex: 1 },
})

export default Membership