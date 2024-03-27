import { Image } from 'expo-image';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StylePropType } from 'react-native-gifted-chat';
// TODO: support web
import Lightbox from 'react-native-lightbox-v2';

const styles = StyleSheet.create({
    container: {},
    image: {
        borderRadius: 13,
        margin: 3,
        resizeMode: 'cover',
    },
    imageActive: {
        flex: 1,
        resizeMode: 'contain',
    },
});

const Renderer = ({ uri, thumbnail, style, imageProps, onLongPress, currentMessage, lightboxProps }) => {

    const [actualImage, setActualImage] = useState(thumbnail || uri)

    return <Lightbox activeProps={{
        style: styles.imageActive,
    }} {...lightboxProps}
        onOpen={() => {
            setActualImage(uri)
        }}
        onLongPress={() => { onLongPress({}, currentMessage) }}
    >
        <Image {...imageProps} style={style} placeholder={'加载中'}
            source={{ uri: actualImage }} />
    </Lightbox>
}

export const MessageImage = ({ containerStyle, lightboxProps = {}, imageProps = {}, imageStyle, currentMessage, onLongPress }) => {
    if (currentMessage == null) {
        return null;
    }

    return (<View style={[styles.container, containerStyle]}>
        <Renderer uri={currentMessage.image} thumbnail={currentMessage.event?.getContent()?.info?.thumbnail_url}
            onLongPress={onLongPress} currentMessage={currentMessage} lightboxProps={lightboxProps}
            style={[styles.image, imageStyle, { width: currentMessage.w, height: currentMessage.h }]} imageProps={imageProps}></Renderer>
    </View>);
}
MessageImage.propTypes = {
    currentMessage: PropTypes.object,
    containerStyle: StylePropType,
    imageStyle: StylePropType,
    imageProps: PropTypes.object,
    lightboxProps: PropTypes.object,
};
//# sourceMappingURL=MessageImage.js.map