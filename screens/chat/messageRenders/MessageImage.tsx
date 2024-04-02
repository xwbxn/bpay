import { Image } from 'expo-image';
import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StylePropType } from 'react-native-gifted-chat';
// TODO: support web
import Lightbox from 'react-native-lightbox-v2';

const styles = StyleSheet.create({
    container: {
    },
    image: {
        borderRadius: 13,
        margin: 3,
        resizeMode: 'cover'
    },
    imageActive: {
        flex: 1,
        resizeMode: 'contain',
    },
});
export const MessageImage = ({ containerStyle, lightboxProps = {}, imageProps = {}, imageStyle, currentMessage, onLongPress }) => {
    if (currentMessage == null) {
        return null;
    }

    let { w, h } = currentMessage
    const ratio = Math.max(currentMessage.h, currentMessage.w) / 150
    if (ratio > 1) {
        w = Math.floor(w / ratio)
        h = Math.floor(h / ratio)
    }


    return (<View style={[styles.container, containerStyle]}>
        {// @ts-ignore: 2322
            <Lightbox activeProps={{
                style: styles.imageActive,
            }} {...lightboxProps}
                onLongPress={() => { onLongPress({}, currentMessage) }}
            >
                <Image {...imageProps} source={{ uri: currentMessage.image }}
                    style={[styles.image, imageStyle, { width: w, height: h }]}>
                </Image>
            </Lightbox>
        }
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