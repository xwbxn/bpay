import { Icon } from '@rneui/themed';
import { Image } from 'expo-image';

import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
// TODO: support web
import { StylePropType } from 'react-native-gifted-chat';

export const MessageVideo = ({ containerStyle, imageProps = {}, imageStyle, currentMessage, onLongPress, onPress }) => {
  if (currentMessage == null) {
    return null;
  }

  return (<View style={[styles.container, containerStyle]}>
    <TouchableOpacity style={{ maxHeight: 150, maxWidth: 180 }}
      onPress={() => onPress({}, currentMessage)}
      onLongPress={() => onLongPress({}, currentMessage)}>
      <View>
        <Icon containerStyle={{
          position: 'absolute', zIndex: 1,
          width: currentMessage.w, height: currentMessage.h, maxHeight: 150, maxWidth: 150, justifyContent: 'center'
        }}
          size={50} name={'play'} type='octicon' color='#43484d' ></Icon>
        <Image {...imageProps} style={[styles.image, imageStyle, {
          opacity: 0.8,
          width: currentMessage.w, height: currentMessage.h, maxHeight: 150, maxWidth: 150
        }]} source={{ uri: currentMessage.video }} />
      </View>
    </TouchableOpacity>
  </View>);
}

MessageVideo.propTypes = {
  currentMessage: PropTypes.object,
  containerStyle: StylePropType,
  imageStyle: StylePropType,
  imageProps: PropTypes.object,
  lightboxProps: PropTypes.object,
};

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
})