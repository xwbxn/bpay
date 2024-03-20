import React, { useEffect, useState } from 'react'
import { StyleSheet } from 'react-native'
import { Image } from 'expo-image';
import * as vt from 'expo-video-thumbnails';
import { Icon, useTheme } from '@rneui/themed';

export const VideoThumbnails = ({ imageProps, imageStyle, uri }) => {

    const { theme } = useTheme()
    const [thumbnails, setThumbnails] = useState('')
    useEffect(() => {
        vt.getThumbnailAsync(uri).then(({ uri }) => {
            setThumbnails(uri)
        })
    }, [uri])

    return <>
        <Icon containerStyle={{ position: 'absolute', zIndex: 1, width: '100%', height: '100%', justifyContent: 'center' }}
            size={50} name='play' type='octicon' color={theme.colors.grey1} ></Icon>
        <Image {...imageProps} style={[styles.image, imageStyle, { opacity: 0.8 }]} source={{ uri: thumbnails }} />
    </>
}

const styles = StyleSheet.create({
    container: {},
    image: {
        width: 150,
        height: 100,
        borderRadius: 13,
        margin: 3,
        resizeMode: 'cover',
    },
    imageActive: {
        flex: 1,
        resizeMode: 'contain',
    },
})