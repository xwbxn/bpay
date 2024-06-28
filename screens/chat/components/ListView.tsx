import React, { useEffect, useState } from 'react';
import ParsedText from 'react-native-parsed-text';
import { View } from 'react-native';
import { Text, ListItem, useTheme } from '@rneui/themed';

import { globalStyle } from '../../../utils/styles';
import { Image } from 'expo-image';

export interface IListItem {
    id: string | number
    title: string
    subtitle?: string
    avatar?: string
    right?: React.ReactNode
    data?: any
}

interface IProps {
    items: IListItem[]
    itemKey?: string
    search?: string
    size?: number
    highlight?: string | RegExp

    accordion?: boolean
    accordionTitle?: string
    accordionExpand?: boolean

    enableSelect?: boolean
    multiSelect?: boolean
    selectedValues?: (string | number)[]
    allowRemove?: boolean

    onPressItem?: (item: IListItem) => void
    onLongPressItem?: (item: IListItem) => void
    onSelected?: (items: IListItem[]) => void
}

export const ListView = ({
    items,
    search = "",
    size = 50,
    highlight = null,
    accordion,
    accordionExpand = true,
    accordionTitle,
    enableSelect,
    multiSelect,
    selectedValues = [],
    allowRemove = false,
    onSelected,
    onLongPressItem,
    onPressItem,
}: IProps) => {

    const { theme } = useTheme()
    const [isExpanded, setIsExpanded] = useState(accordionExpand)
    const [filterdItems, setFilterdItems] = useState(items)
    const [checkedItems, setCheckedItems] = useState<{ [id: string | number]: boolean }>({})
    const [initValues, setInitValues] = useState([])

    useEffect(() => {
        if (search !== "") {
            const _filterdItems = items.filter(i => i.title?.includes(search) || i.subtitle?.includes(search))
            setFilterdItems(_filterdItems)
        } else {
            setFilterdItems(items)
        }
    }, [items, search])

    useEffect(() => {
        const values = multiSelect ? { ...checkedItems } : {}
        selectedValues.forEach(i => {
            values[i] = true
        })
        setInitValues([...selectedValues])
        setCheckedItems(values)
    }, [])


    const onCheckItem = (m) => {
        const values = multiSelect ? { ...checkedItems } : {}
        if (!allowRemove && initValues.includes(m.id) && values[m.id]) {
            return
        }
        values[m.id] = !values[m.id]
        onSelected && onSelected(filterdItems.filter(i => values[i.id]))
        setCheckedItems(values)

        if (values[m.id]) {
            selectedValues.push(m.id)
        } else {
            selectedValues.splice(selectedValues.indexOf(m.id), 1)
        }
    }

    const renderListItem = () => {
        return <>{filterdItems.map(m => {
            return (
                <ListItem topDivider bottomDivider key={m.id} containerStyle={{ padding: 10 }}
                    onPress={() => { enableSelect ? onCheckItem(m) : onPressItem && onPressItem(m) }}
                    onLongPress={() => { onLongPressItem && onLongPressItem(m) }}>
                    {enableSelect && <ListItem.CheckBox checked={checkedItems[m.id]}
                        checkedColor={!allowRemove && initValues.includes(m.id) ? theme.colors.grey4 : theme.colors.primary}
                        onPress={() => onCheckItem(m)}></ListItem.CheckBox>}
                    {m.avatar
                        ? <Image source={{ uri: m.avatar }} style={{ width: size, height: size, borderRadius: 5 }}></Image>
                        : <View style={{ backgroundColor: theme.colors.primary, height: size, width: size, borderRadius: 5, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: theme.colors.background, fontSize: size * 0.6, fontWeight: 'bold' }}>{m.title[0].toUpperCase()}</Text>
                        </View>}
                    <ListItem.Content>
                        <ListItem.Title numberOfLines={1} style={{ fontSize: globalStyle.titleFontStyle.fontSize }}>{m.title}</ListItem.Title>
                        <ListItem.Subtitle >
                            <ParsedText numberOfLines={1} style={{ color: theme.colors.grey2 }}
                                parse={highlight && [{ pattern: highlight, style: { color: theme.colors.primary } }]}>{m.subtitle}</ParsedText>
                        </ListItem.Subtitle>
                    </ListItem.Content>
                    {m.right ?
                        <ListItem.Subtitle style={{ color: theme.colors.grey2 }}>{m.right}</ListItem.Subtitle> :
                        <ListItem.Chevron></ListItem.Chevron>}
                </ListItem>)
        })}</>
    }

    return accordion ? (<ListItem.Accordion content={
        <ListItem.Content>
            <ListItem.Title>{accordionTitle}({filterdItems.length})</ListItem.Title>
        </ListItem.Content>
    } isExpanded={isExpanded} onPress={() => setIsExpanded(!isExpanded)}>
        {renderListItem()}
    </ListItem.Accordion>) :
        renderListItem()
}
