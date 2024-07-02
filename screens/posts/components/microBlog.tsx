import { View, StyleSheet } from 'react-native'
import React, { useMemo } from 'react'
import { useTheme, Text, Chip, Icon, Button } from '@rneui/themed'
import { Image } from 'expo-image'
import moment from 'moment'

export interface IMicroBlogProps {
    author: {
        id: string,
        name: string,
        avatar?: string,
    },
    content: string,
    images?: {
        uri: string,
        width?: number,
        height?: number,
    }[],
    hotComment?: {
        name: string,
        content: string
    },
    publishTime: number | Date,
    comment?: number,
    favor?: number,
    like?: number,
    onImagePress?: (image) => void
    onAvatarPress?: (author) => void
    onFollowPress?: (author) => void
}

const MicroBlog = (opts: IMicroBlogProps) => {
    const {
        author,
        content,
        images = [],
        publishTime,
        hotComment = null,
        comment = 0,
        favor = 0,
        like = 0
    } = opts

    const { theme } = useTheme()

    const DEFAULT_HEIGHT = 220

    const renderImages = (images) => {
        if (images.length === 1) {
            const img = images[0]
            const ratio = img.height / DEFAULT_HEIGHT
            const imgWidth = img.width / ratio
            return <View>
                <Image source={{ uri: img.uri }}
                    style={{ borderRadius: 5, height: DEFAULT_HEIGHT, width: imgWidth, maxWidth: '100%' }}
                    contentFit='cover'></Image></View>
        }
        if (images.length === 2) {
            return <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {images.map((img, index) => <Image key={index} source={{ uri: img.uri }}
                    style={{ borderRadius: 5, height: DEFAULT_HEIGHT, width: '50%' }}
                    contentFit='cover'></Image>)}
            </View>
        }
        if (images.length === 3) {
            return <View style={{ height: DEFAULT_HEIGHT + 4, flexWrap: 'wrap' }}>
                <Image source={{ uri: images[0].uri }}
                    style={{ borderRadius: 5, height: DEFAULT_HEIGHT + 2, width: '50%', marginRight: 1 }}
                    contentFit='cover'></Image>
                {images.slice(1).map((img, index) => <Image key={index} source={{ uri: img.uri }}
                    style={{ borderRadius: 5, height: DEFAULT_HEIGHT / 2, width: '50%', marginBottom: 2 }}
                    contentFit='cover'></Image>)}
            </View>
        }
        if (images.length >= 4) {
            return <View style={{
                flexDirection: 'row',
                height: DEFAULT_HEIGHT + 4,
                flexWrap: 'wrap',
                justifyContent: 'space-between'
            }}>
                {images.slice(0, 4).map((img) => <Image source={{ uri: img.uri }}
                    style={{ borderRadius: 5, height: DEFAULT_HEIGHT / 2, width: '49.8%', marginBottom: 2 }}
                    contentFit='cover'></Image>)}
            </View>
        }
    }

    const styles = useMemo(() => {
        return StyleSheet.create({
            contaier: {
                backgroundColor: theme.colors.background,
                padding: 16,
                marginBottom: 8
            },
            header: {
                flexDirection: 'row'
            },
            headerLeft: {

            },
            headerCenter: {
                flex: 1,
                paddingLeft: 8,
                justifyContent: 'center'
            },
            headerCenterTitle: {
                fontSize: 16,
                fontWeight: 'bold',
            },
            headerCenterTime: {
                fontSize: 14,
                color: theme.colors.grey0
            },
            headerRight: {
                justifyContent: 'center',
                paddingRight: 8
            },
            contentBox: {
                paddingVertical: 16
            },
            content: {
                fontSize: 16,
                lineHeight: 28
            },
            imageList: {

            },
            comment: {
                flexDirection: 'row',
                marginTop: 12,
                padding: 8,
                borderRadius: 3,
                backgroundColor: '#f5f5f5'
            },
            commentName: {
                fontWeight: 'bold',
                fontSize: 14
            },
            footer: {
                flexDirection: 'row', justifyContent: 'space-between'
            }
        })
    }, [theme])

    return <>
        <View style={styles.contaier}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Image source={{ uri: author.avatar }} style={{ width: 40, height: 40, borderRadius: 5 }} contentFit='cover'></Image>
                </View>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerCenterTitle}>{author.name}</Text>
                    <Text style={styles.headerCenterTime}>{moment(publishTime).fromNow()}</Text>
                </View>
                <View style={styles.headerRight}>
                    <Chip title={'关注'} size='sm'></Chip>
                </View>
            </View>
            <View style={styles.contentBox}><Text style={styles.content}>{content}</Text></View>
            <View style={styles.imageList}>
                {renderImages(images)}
            </View>
            {hotComment && <View style={styles.comment}>
                <Text style={styles.commentName}>{`${hotComment.name}: `}</Text><Text>{hotComment.content}</Text>
            </View>}
            <View style={styles.footer}>
                <Button type='clear' titleStyle={{ color: theme.colors.black, marginLeft: 8 }} size='sm' title={'分享'} icon={<Icon name='share' size={18}></Icon>}></Button>
                <Button type='clear' titleStyle={{ color: theme.colors.black, marginLeft: 8 }} size='sm' title={`${comment}`} icon={<Icon name='comment' size={18}></Icon>}></Button>
                <Button type='clear' titleStyle={{ color: theme.colors.black, marginLeft: 8 }} size='sm' title={`${favor}`} icon={<Icon name='favorite' size={18}></Icon>}></Button>
                <Button type='clear' titleStyle={{ color: theme.colors.black, marginLeft: 8 }} size='sm' title={`${like}`} icon={<Icon name='recommend' size={18}></Icon>}></Button>
            </View>
        </View>
    </>
}

export default MicroBlog