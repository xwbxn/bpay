import { Avatar, ListItem, useTheme } from '@rneui/themed'
import React, { useEffect, useState } from 'react'

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
    search?: string

    accordion?: boolean
    accordionTitle?: string
    accordionExpand?: boolean

    enableSelect?: boolean
    multiSelect?: boolean

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
    onSelected,
    onLongPressItem,
    onPressItem,
}: IProps) => {

    const { theme } = useTheme()
    const [isExpanded, setIsExpanded] = useState(accordionExpand)
    const [filterdItems, setFilterdItems] = useState(items)
    const [checkedItems, setCheckedItems] = useState<{ [id: string | number]: boolean }>({})

    useEffect(() => {
        const _checkItems = {}
        filterdItems.forEach(i => {
            Object.assign(_checkItems, { [i.id]: false })
        })
    }, [filterdItems])

    useEffect(() => {
        if (search !== "") {
            const _filterdItems = items.filter(i => i.title?.includes(search) || i.subtitle?.includes(search))
            setFilterdItems(_filterdItems)
        } else {
            setFilterdItems(items)
        }
        console.log('items', items)
    }, [items, search])

    const onCheckItem = (m) => {
        const values = multiSelect ? { ...checkedItems } : {}
        values[m.id] = !values[m.id]
        onSelected && onSelected(filterdItems.filter(i => values[i.id]))
        setCheckedItems(values)
    }

    const renderListItem = () => {
        return <>{filterdItems.map(m => {
            return (
                <ListItem topDivider bottomDivider key={m.id}
                    onPress={() => { enableSelect ? onCheckItem(m) : onPressItem && onPressItem(m) }}
                    onLongPress={() => { onLongPressItem && onLongPressItem(m) }}>
                    {enableSelect && <ListItem.CheckBox checked={checkedItems[m.id]} onPress={() => onCheckItem(m)}></ListItem.CheckBox>}
                    {m.avatar
                        ? <Avatar size={50} rounded source={{ uri: m.avatar }}
                            containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
                        : <Avatar size={50} rounded title={m.title[0]}
                            containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>}
                    <ListItem.Content>
                        <ListItem.Title style={{ fontSize: 22 }}>{m.title}</ListItem.Title>
                        <ListItem.Subtitle>{m.subtitle}</ListItem.Subtitle>
                    </ListItem.Content>
                    {m.right ?
                        <ListItem.Subtitle>{m.right}</ListItem.Subtitle> :
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
