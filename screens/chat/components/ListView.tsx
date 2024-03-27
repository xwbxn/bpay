import React, { useEffect, useState } from 'react';

import { Avatar, ListItem, useTheme } from '@rneui/themed';

export interface IListItem {
    id: string | number
    title: string
    subtitle?: string
    avatar?: string
    right?: string
    data?: any
}

interface IProps {
    items: IListItem[]
    itemKey?: string
    search?: string

    accordion?: boolean
    accordionTitle?: string
    accordionExpand?: boolean

    enableSelect?: boolean
    multiSelect?: boolean
    selectedValue?: (string | number)[]

    onPressItem?: (item: IListItem) => void
    onLongPressItem?: (item: IListItem) => void
    onSelected?: (items: IListItem[]) => void
}

export const ListView = ({
    items,
    search = "",
    accordion,
    accordionExpand = true,
    accordionTitle,
    enableSelect,
    multiSelect,
    selectedValue = [],
    onSelected,
    onLongPressItem,
    onPressItem,
}: IProps) => {

    const { theme } = useTheme()
    const [isExpanded, setIsExpanded] = useState(accordionExpand)
    const [filterdItems, setFilterdItems] = useState(items)
    const [checkedItems, setCheckedItems] = useState<{ [id: string | number]: boolean }>({})

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
        selectedValue.forEach(i => {
            values[i] = true
        })
        setCheckedItems(values)
    }, [])


    const onCheckItem = (m) => {
        const values = multiSelect ? { ...checkedItems } : {}
        values[m.id] = !values[m.id]
        onSelected && onSelected(filterdItems.filter(i => values[i.id]))
        setCheckedItems(values)

        if (values[m.id]) {
            selectedValue.push(m.id)
        } else {
            selectedValue.splice(selectedValue.indexOf(m.id), 1)
        }
    }

    const renderListItem = () => {
        return <>{filterdItems.map(m => {
            return (
                <ListItem topDivider bottomDivider key={m.id} containerStyle={{padding: 10}}
                    onPress={() => { enableSelect ? onCheckItem(m) : onPressItem && onPressItem(m) }}
                    onLongPress={() => { onLongPressItem && onLongPressItem(m) }}>
                    {enableSelect && <ListItem.CheckBox checked={checkedItems[m.id]}
                        onPress={() => onCheckItem(m)}></ListItem.CheckBox>}
                    {m.avatar
                        ? <Avatar size={50} rounded source={{ uri: m.avatar }}
                            containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
                        : <Avatar size={50} rounded title={m.title[0]}
                            containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>}
                    <ListItem.Content>
                        <ListItem.Title style={{ fontSize: 18 }}>{m.title}</ListItem.Title>
                        <ListItem.Subtitle style={{ color: theme.colors.grey2 }}>{m.subtitle}</ListItem.Subtitle>
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
