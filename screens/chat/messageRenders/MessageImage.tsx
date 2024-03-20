import { Image } from 'expo-image';
import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StylePropType } from 'react-native-gifted-chat';
// TODO: support web
import Lightbox from 'react-native-lightbox-v2';

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
});
export const MessageImage = ({ containerStyle, lightboxProps = {}, imageProps = {}, imageStyle, currentMessage, }) => {
    if (currentMessage == null) {
        return null;
    }
    return (<View style={[styles.container, containerStyle]}>
        {// @ts-ignore: 2322
            <Lightbox activeProps={{
                style: styles.imageActive,
            }} {...lightboxProps}>

                <Image {...imageProps} style={[styles.image, imageStyle]} source={{ uri: currentMessage.image }} />
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