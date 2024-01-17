import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Tab, TabView, Chip } from '@rneui/themed';
import { useEffect, useState } from 'react';
import { getCategories } from '../../service/wordpress';

export default function PostList({ route, navigation }) {

    const { id } = route.params
    const [currentCate, setCurrentCate] = useState([])
    const [currentSubCate, setCurrentSubCate] = useState([])
    const [index, setIndex] = useState(0)

    useEffect(() => {
        getCategories().then(res => {
            return Promise.resolve(res)
        }).then(res => {
            const data = res.filter(v => v.parent === id)
            data.forEach(v => {
                v.children = res.filter(i => i.parent === v.id)
            })
            setCurrentCate(data)
        })
    }, [id])

    useEffect(() => {
        if (currentCate[index]) {
            setCurrentSubCate(currentCate[index].children || [])
        }
    }, [index])

    return <>
        <SafeAreaView style={{ flex: 1 }}>
            <View>
                <Tab value={index} onChange={setIndex} scrollable dense variant="primary">
                    {currentCate.map(v => <Tab.Item key={v.id} title={v.name}></Tab.Item>)}
                </Tab>
            </View>
            <View style={{ flex: 1 }}>
                <TabView value={index} onChange={setIndex}>
                    {currentCate.map(v => <TabView.Item key={v.id} >
                        <View style={{ flexDirection: 'row' }}>
                            {currentSubCate.map(i => <Chip key={i.id} type={'outline'} size="sm">{i.name}</Chip>)}
                        </View>
                    </TabView.Item>)}
                </TabView>
            </View>
        </SafeAreaView>
    </>
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        // justifyContent: 'center',
    }
})