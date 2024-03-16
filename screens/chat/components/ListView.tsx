import { Avatar, ListItem, useTheme } from '@rneui/themed'
import React, { useEffect, useState } from 'react'

interface IListItem {
    id: string | number
    title: string
    subtitle?: string
    avatar?: string
    right?: string
}

interface IProps {
    items: IListItem[]

    accordion?: boolean
    accordionTitle?: string
    accordionExpand?: boolean

    enableSelect?: boolean
    multiSelect?: boolean

    onPressItem?: (item: IListItem) => void
    onLongPressItem?: (item: IListItem) => void
    onSelected?: (items: IListItem[]) => void
}

export const ListView = (props: IProps) => {

    const { theme } = useTheme()
    const { items,
        accordion,
        accordionTitle,
        accordionExpand,
        enableSelect,
        multiSelect,
        onSelected,
        onLongPressItem,
        onPressItem } = props
    const [isExpanded, setIsExpanded] = useState(accordionExpand)
    const [checkedItems, setCheckedItems] = useState<{ [id: string | number]: boolean }>({})

    useEffect(() => {
        const _checkItems = {}
        items.forEach(i => {
            Object.assign(_checkItems, { [i.id]: false })
        })
    }, [items])

    useEffect(() => {

    }, [checkedItems])

    const onCheckItem = (m) => {
        const values = multiSelect ? { ...checkedItems } : {}
        values[m.id] = !values[m.id]
        onSelected && onSelected(items.filter(i => values[i.id]))
        setCheckedItems(values)
    }

    const renderListItem = () => {
        return <>{items.map(m => {
            return (
                <ListItem topDivider bottomDivider key={m.id}
                    onPress={() => { onPressItem && onPressItem(m) }}
                    onLongPress={() => { onLongPressItem && onLongPressItem(m) }}>
                    {enableSelect && <ListItem.CheckBox checked={checkedItems[m.id]} onPress={() => onCheckItem(m)}></ListItem.CheckBox>}
                    <Avatar size={50} rounded title={m.title[0]} source={{ uri: m.avatar }}
                        containerStyle={{ backgroundColor: theme.colors.primary }}></Avatar>
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
            <ListItem.Title>{accordionTitle}</ListItem.Title>
        </ListItem.Content>
    } isExpanded={isExpanded} onPress={() => setIsExpanded(!isExpanded)}>
        {renderListItem()}
    </ListItem.Accordion>) :
        renderListItem()
}
